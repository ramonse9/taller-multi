export function companyLoginCodeBase(commercialName: string): string {
  const base = commercialName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  if (!/^[a-z][a-z0-9_]+$/.test(base)) {
    throw new Error('El nombre comercial no genera un código público válido');
  }
  return base;
}

export function tenantLoginName(username: string, companyLoginCode: string): string {
  return `${username}@${companyLoginCode}`;
}
