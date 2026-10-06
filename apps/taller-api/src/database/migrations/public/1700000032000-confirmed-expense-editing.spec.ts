import { QueryRunner } from 'typeorm';
import { ConfirmedExpenseEditing1700000032000 } from './1700000032000-confirmed-expense-editing';

describe('ConfirmedExpenseEditing1700000032000', () => {
  it('confirma borradores, cambia el valor predeterminado y crea la bitácora por tenant', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ id: 'company-id', schema_name: '_0001_mul_taller' }])
      .mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new ConfirmedExpenseEditing1700000032000().up(runner);

    const statements = query.mock.calls.map(([sql]) => sql);
    expect(
      statements.some((sql) =>
        sql.includes('CREATE TABLE "_0001_mul_taller".expense_change_history'),
      ),
    ).toBe(true);
    expect(statements.some((sql) => sql.includes("SET status = 'confirmed'"))).toBe(true);
    expect(statements.some((sql) => sql.includes("status SET DEFAULT 'confirmed'"))).toBe(true);
    expect(statements.some((sql) => sql.includes('previous_status, new_status'))).toBe(true);
    expect(query.mock.calls.at(-1)?.[1]).toEqual([
      'company-id',
      'ConfirmedExpenseEditing1700000032000',
    ]);
  });
});
