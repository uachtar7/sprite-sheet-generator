const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function writeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function u16(value: number): Uint8Array {
  const buf = new Uint8Array(2);
  buf[0] = value & 0xff;
  buf[1] = (value >>> 8) & 0xff;
  return buf;
}

function u32(value: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = value & 0xff;
  buf[1] = (value >>> 8) & 0xff;
  buf[2] = (value >>> 16) & 0xff;
  buf[3] = (value >>> 24) & 0xff;
  return buf;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Build an uncompressed ZIP (STORE method). No extra dependencies. */
export function createZip(files: ZipEntry[]): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = writeUtf8(file.name);
    const checksum = crc32(file.data);
    const size = file.data.length;

    const localHeader = [
      u32(0x04034b50),
      u16(10),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
    ];

    const localHeaderLength =
      30 + nameBytes.length;
    localParts.push(...localHeader, file.data);

    const centralHeader = [
      u32(0x02014b50),
      u16(20),
      u16(10),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ];
    centralParts.push(...centralHeader);

    offset += localHeaderLength + size;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = [
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralSize),
    u32(offset),
    u16(0),
  ];

  return new Blob([...localParts, ...centralParts, ...endRecord], {
    type: "application/zip",
  });
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function triggerBlobDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadUrlAsFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}`);
  }
  const blob = await response.blob();
  triggerBlobDownload(filename, blob);
}

export async function downloadFramesZip(input: {
  zipName: string;
  frames: Array<{ filename: string; dataUrl: string }>;
}): Promise<void> {
  const files = input.frames.map((frame) => ({
    name: frame.filename,
    data: dataUrlToUint8Array(frame.dataUrl),
  }));
  const zip = createZip(files);
  triggerBlobDownload(input.zipName, zip);
}
