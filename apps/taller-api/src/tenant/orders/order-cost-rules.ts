const SQL_IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;

/**
 * A missing service cost is treated as zero. Only a free product without a
 * captured cost makes an order's profitability incomplete.
 */
export function unknownOrderItemCostSql(alias: string): string {
  if (!SQL_IDENTIFIER.test(alias)) throw new Error('Invalid SQL alias');
  return `${alias}.kind = 'product'
    AND ${alias}.product_service_id IS NULL
    AND ${alias}.cost_total IS NULL`;
}
