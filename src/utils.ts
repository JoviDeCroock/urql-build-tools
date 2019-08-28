export const prettyPrintBytes = size => {
  if (size / 1000 > 1) {
    return `${(size / 1000).toFixed(2)}kB`;
  }
  return `${size}B}`;
};
