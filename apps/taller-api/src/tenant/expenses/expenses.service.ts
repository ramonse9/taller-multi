import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import {
  ChangeExpenseStatusDto,
  CreateExpenseDto,
  ExpenseCategoryResponseDto,
  ExpenseCategoryAmountResponseDto,
  ExpenseMonthlySummaryQueryDto,
  ExpenseMonthlySummaryResponseDto,
  ExpenseQueryDto,
  ExpenseRecurrenceType,
  ExpenseResponseDto,
  ExpenseStatus,
  ExpenseStatusHistoryResponseDto,
  ExpenseSummaryResponseDto,
  PaginatedExpensesResponseDto,
  UpdateExpenseDto,
} from './dto/expense.dto';

interface ExpenseRow {
  id: string;
  category_id: string;
  category_code: string;
  category_name: string;
  category_is_active: boolean;
  category_is_system: boolean;
  supplier_id: string;
  supplier_name: string;
  supplier_is_system: boolean;
  status: ExpenseStatus;
  recurrence_type: ExpenseRecurrenceType;
  occurred_on: string;
  description: string;
  reference: string | null;
  amount: string;
  notes: string | null;
  receipt_file_key: string | null;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface ExpenseStatusHistoryRow {
  id: string;
  previous_status: ExpenseStatus | null;
  new_status: ExpenseStatus;
  changed_by_user_id: string;
  changed_by_name: string;
  changed_at: Date;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly tenant: TenantSessionService) {}

  categories(user: AuthenticatedUser): Promise<ExpenseCategoryResponseDto[]> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const rows = (await runner.query(
        `SELECT id, code, name, is_active, is_system
         FROM ${quoteIdentifier(schemaName)}.expense_categories
         WHERE is_active = true ORDER BY name, id`,
      )) as Array<{
        id: string;
        code: string;
        name: string;
        is_active: boolean;
        is_system: boolean;
      }>;
      return rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        isActive: row.is_active,
        isSystem: row.is_system,
      }));
    });
  }

  list(user: AuthenticatedUser, query: ExpenseQueryDto): Promise<PaginatedExpensesResponseDto> {
    if (query.occurredFrom && query.occurredTo && query.occurredFrom > query.occurredTo) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');
    }
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const search = `%${this.escapeLike(query.search)}%`;
      const parameters = [
        query.status ?? null,
        query.recurrenceType ?? null,
        query.categoryId ?? null,
        query.supplierId ?? null,
        search,
        query.occurredFrom ?? null,
        query.occurredTo ?? null,
      ];
      const where = `($1::varchar IS NULL OR expense.status = $1)
        AND ($2::varchar IS NULL OR expense.recurrence_type = $2)
        AND ($3::uuid IS NULL OR expense.category_id = $3)
        AND ($4::uuid IS NULL OR expense.supplier_id = $4)
        AND ($5 = '%%' OR expense.description ILIKE $5 ESCAPE '\\'
          OR COALESCE(expense.reference, '') ILIKE $5 ESCAPE '\\'
          OR category.name ILIKE $5 ESCAPE '\\'
          OR supplier.name ILIKE $5 ESCAPE '\\')
        AND ($6::date IS NULL OR expense.occurred_on >= $6)
        AND ($7::date IS NULL OR expense.occurred_on <= $7)`;
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total
         FROM ${schema}.expenses expense
         JOIN ${schema}.expense_categories category ON category.id = expense.category_id
         JOIN ${schema}.suppliers supplier ON supplier.id = expense.supplier_id
         WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `${this.expenseSelect(schema)} WHERE ${where}
         ORDER BY expense.occurred_on DESC, expense.created_at DESC, expense.id DESC
         LIMIT $8 OFFSET $9`,
        [...parameters, query.limit, offset],
      )) as ExpenseRow[];
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + rows.length < totalItems,
        items: rows.map((row) => this.toSummary(row)),
      };
    });
  }

  monthlySummary(
    user: AuthenticatedUser,
    query: ExpenseMonthlySummaryQueryDto,
  ): Promise<ExpenseMonthlySummaryResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const summaryRows = (await runner.query(
        `WITH period AS (
           SELECT COALESCE(
             to_date($1, 'YYYY-MM'), date_trunc('month', current_date)::date
           ) AS starts_on
         ), totals AS (
           SELECT period.starts_on,
             count(*) FILTER (
               WHERE expense.status = 'confirmed'
                 AND expense.occurred_on >= period.starts_on
                 AND expense.occurred_on < period.starts_on + interval '1 month'
             )::int AS confirmed_count,
             COALESCE(sum(expense.amount) FILTER (
               WHERE expense.status = 'confirmed'
                 AND expense.occurred_on >= period.starts_on
                 AND expense.occurred_on < period.starts_on + interval '1 month'
             ), 0) AS confirmed_amount,
             count(*) FILTER (
               WHERE expense.status = 'confirmed'
                 AND expense.occurred_on >= period.starts_on - interval '1 month'
                 AND expense.occurred_on < period.starts_on
             )::int AS previous_confirmed_count,
             COALESCE(sum(expense.amount) FILTER (
               WHERE expense.status = 'confirmed'
                 AND expense.occurred_on >= period.starts_on - interval '1 month'
                 AND expense.occurred_on < period.starts_on
             ), 0) AS previous_confirmed_amount,
             count(*) FILTER (
               WHERE expense.status = 'draft'
                 AND expense.occurred_on >= period.starts_on
                 AND expense.occurred_on < period.starts_on + interval '1 month'
             )::int AS draft_count,
             COALESCE(sum(expense.amount) FILTER (
               WHERE expense.status = 'draft'
                 AND expense.occurred_on >= period.starts_on
                 AND expense.occurred_on < period.starts_on + interval '1 month'
             ), 0) AS draft_amount
           FROM period LEFT JOIN ${schema}.expenses expense ON true
           GROUP BY period.starts_on
         )
         SELECT to_char(starts_on, 'YYYY-MM') AS month,
           to_char(starts_on - interval '1 month', 'YYYY-MM') AS previous_month,
           confirmed_count, confirmed_amount::numeric(14,2)::text,
           previous_confirmed_count, previous_confirmed_amount::numeric(14,2)::text,
           (confirmed_amount - previous_confirmed_amount)::numeric(14,2)::text AS change_amount,
           CASE WHEN previous_confirmed_amount = 0 THEN NULL
             ELSE round(
               ((confirmed_amount - previous_confirmed_amount) / previous_confirmed_amount) * 100,
               2
             )::text END AS change_percent,
           CASE WHEN confirmed_amount > previous_confirmed_amount THEN 'increase'
             WHEN confirmed_amount < previous_confirmed_amount THEN 'decrease'
             ELSE 'same' END AS direction,
           draft_count, draft_amount::numeric(14,2)::text
         FROM totals`,
        [query.month ?? null],
      )) as Array<{
        month: string;
        previous_month: string;
        confirmed_count: number;
        confirmed_amount: string;
        previous_confirmed_count: number;
        previous_confirmed_amount: string;
        change_amount: string;
        change_percent: string | null;
        direction: 'increase' | 'decrease' | 'same';
        draft_count: number;
        draft_amount: string;
      }>;
      const categoryRows = (await runner.query(
        `WITH period AS (
           SELECT COALESCE(
             to_date($1, 'YYYY-MM'), date_trunc('month', current_date)::date
           ) AS starts_on
         )
         SELECT category.id, category.code, category.name, category.is_active,
           category.is_system, count(*)::int AS count, sum(expense.amount)::text AS amount
         FROM period
         JOIN ${schema}.expenses expense
           ON expense.occurred_on >= period.starts_on
          AND expense.occurred_on < period.starts_on + interval '1 month'
          AND expense.status = 'confirmed'
         JOIN ${schema}.expense_categories category ON category.id = expense.category_id
         GROUP BY category.id, category.code, category.name, category.is_active, category.is_system
         ORDER BY sum(expense.amount) DESC, category.name`,
        [query.month ?? null],
      )) as Array<{
        id: string;
        code: string;
        name: string;
        is_active: boolean;
        is_system: boolean;
        count: number;
        amount: string;
      }>;
      const recentRows = (await runner.query(
        `${this.expenseSelect(schema)}
         ORDER BY expense.occurred_on DESC, expense.created_at DESC, expense.id DESC LIMIT 5`,
      )) as ExpenseRow[];
      const summary = summaryRows[0]!;
      const byCategory: ExpenseCategoryAmountResponseDto[] = categoryRows.map((row) => ({
        category: {
          id: row.id,
          code: row.code,
          name: row.name,
          isActive: row.is_active,
          isSystem: row.is_system,
        },
        count: row.count,
        amount: row.amount,
      }));
      return {
        month: summary.month,
        previousMonth: summary.previous_month,
        confirmedCount: summary.confirmed_count,
        confirmedAmount: summary.confirmed_amount,
        previousConfirmedCount: summary.previous_confirmed_count,
        previousConfirmedAmount: summary.previous_confirmed_amount,
        changeAmount: summary.change_amount,
        changePercent: summary.change_percent,
        direction: summary.direction,
        draftCount: summary.draft_count,
        draftAmount: summary.draft_amount,
        byCategory,
        recentExpenses: recentRows.map((row) => this.toSummary(row)),
      };
    });
  }

  getOne(user: AuthenticatedUser, id: string): Promise<ExpenseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) =>
      this.requireExpense(runner, quoteIdentifier(schemaName), id),
    );
  }

  create(user: AuthenticatedUser, input: CreateExpenseDto): Promise<ExpenseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      await this.requireActiveCategory(runner, schema, input.categoryId);
      const supplierId = await this.requireActiveSupplier(runner, schema, input.supplierId);
      const rows = (await runner.query(
        `INSERT INTO ${schema}.expenses(
           category_id, supplier_id, occurred_on, description, reference, amount, notes,
           recurrence_type, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id`,
        [
          input.categoryId,
          supplierId,
          input.occurredOn,
          input.description,
          input.reference ?? null,
          input.amount,
          input.notes ?? null,
          input.recurrenceType ?? ExpenseRecurrenceType.OneTime,
          user.id,
        ],
      )) as Array<{ id: string }>;
      const id = rows[0]!.id;
      await this.recordStatus(runner, schema, id, null, ExpenseStatus.Draft, user.id);
      return this.requireExpense(runner, schema, id);
    });
  }

  update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const current = await this.lockExpense(runner, schema, id);
      if (current.status !== ExpenseStatus.Draft) {
        throw new BadRequestException('Solo los gastos en borrador se pueden editar');
      }
      const categoryId = input.categoryId ?? current.category_id;
      const supplierId = input.supplierId ?? current.supplier_id;
      await this.requireActiveCategory(runner, schema, categoryId);
      await this.requireActiveSupplier(runner, schema, supplierId);
      await runner.query(
        `UPDATE ${schema}.expenses SET
           category_id = $2, supplier_id = $3,
           occurred_on = COALESCE($4::date, occurred_on),
           description = COALESCE($5, description),
           reference = CASE WHEN $6::boolean THEN $7 ELSE reference END,
           amount = COALESCE($8::numeric, amount),
           notes = CASE WHEN $9::boolean THEN $10 ELSE notes END,
           recurrence_type = COALESCE($11, recurrence_type),
           updated_by_user_id = $12, updated_at = now()
         WHERE id = $1`,
        [
          id,
          categoryId,
          supplierId,
          input.occurredOn ?? null,
          input.description ?? null,
          input.reference !== undefined,
          input.reference ?? null,
          input.amount ?? null,
          input.notes !== undefined,
          input.notes ?? null,
          input.recurrenceType ?? null,
          user.id,
        ],
      );
      return this.requireExpense(runner, schema, id);
    });
  }

  changeStatus(
    user: AuthenticatedUser,
    id: string,
    input: ChangeExpenseStatusDto,
  ): Promise<ExpenseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const current = await this.lockExpense(runner, schema, id);
      if (current.status === input.status) {
        throw new BadRequestException(
          input.status === ExpenseStatus.Confirmed
            ? 'El gasto ya fue confirmado'
            : 'El gasto ya fue cancelado',
        );
      }
      if (current.status === ExpenseStatus.Cancelled) {
        throw new BadRequestException('Un gasto cancelado no puede cambiar de estado');
      }
      if (input.status === ExpenseStatus.Confirmed) {
        if (current.status !== ExpenseStatus.Draft) {
          throw new BadRequestException('Solo un gasto en borrador se puede confirmar');
        }
        await this.requireActiveCategory(runner, schema, current.category_id);
        await this.requireActiveSupplier(runner, schema, current.supplier_id);
        await runner.query(
          `UPDATE ${schema}.expenses SET status = 'confirmed', confirmed_at = now(),
           updated_by_user_id = $2, updated_at = now() WHERE id = $1`,
          [id, user.id],
        );
      } else {
        await runner.query(
          `UPDATE ${schema}.expenses SET status = 'cancelled', cancelled_at = now(),
           updated_by_user_id = $2, updated_at = now() WHERE id = $1`,
          [id, user.id],
        );
      }
      await this.recordStatus(runner, schema, id, current.status, input.status, user.id);
      return this.requireExpense(runner, schema, id);
    });
  }

  private async requireActiveCategory(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<void> {
    const rows = (await runner.query(
      `SELECT is_active FROM ${schema}.expense_categories WHERE id = $1`,
      [id],
    )) as Array<{ is_active: boolean }>;
    const category = rows[0];
    if (!category) throw new NotFoundException('Categoría de gasto no encontrada');
    if (!category.is_active) {
      throw new UnprocessableEntityException('La categoría de gasto está desactivada');
    }
  }

  private async requireActiveSupplier(
    runner: QueryRunner,
    schema: string,
    requestedId?: string,
  ): Promise<string> {
    const rows = (await runner.query(
      `SELECT id, is_active FROM ${schema}.suppliers
       WHERE id = COALESCE($1::uuid, (SELECT id FROM ${schema}.suppliers WHERE is_system = true))`,
      [requestedId ?? null],
    )) as Array<{ id: string; is_active: boolean }>;
    const supplier = rows[0];
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    if (!supplier.is_active) throw new UnprocessableEntityException('El proveedor está desactivado');
    return supplier.id;
  }

  private async lockExpense(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<ExpenseRow> {
    const rows = (await runner.query(
      `${this.expenseSelect(schema)} WHERE expense.id = $1 FOR UPDATE OF expense`,
      [id],
    )) as ExpenseRow[];
    const row = rows[0];
    if (!row) throw new NotFoundException('Gasto no encontrado');
    return row;
  }

  private async requireExpense(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<ExpenseResponseDto> {
    const rows = (await runner.query(`${this.expenseSelect(schema)} WHERE expense.id = $1`, [id])) as
      ExpenseRow[];
    const row = rows[0];
    if (!row) throw new NotFoundException('Gasto no encontrado');
    const history = (await runner.query(
      `SELECT status_history.id, status_history.previous_status, status_history.new_status,
        status_history.changed_by_user_id, platform_user.full_name AS changed_by_name,
        status_history.changed_at
       FROM ${schema}.expense_status_history status_history
       JOIN public.users platform_user ON platform_user.id = status_history.changed_by_user_id
       WHERE status_history.expense_id = $1
       ORDER BY status_history.changed_at, status_history.id`,
      [id],
    )) as ExpenseStatusHistoryRow[];
    return {
      ...this.toSummary(row),
      statusHistory: history.map((item) => this.toStatusHistory(item)),
    };
  }

  private async recordStatus(
    runner: QueryRunner,
    schema: string,
    expenseId: string,
    previousStatus: ExpenseStatus | null,
    newStatus: ExpenseStatus,
    userId: string,
  ): Promise<void> {
    await runner.query(
      `INSERT INTO ${schema}.expense_status_history(
         expense_id, previous_status, new_status, changed_by_user_id
       ) VALUES ($1, $2, $3, $4)`,
      [expenseId, previousStatus, newStatus, userId],
    );
  }

  private expenseSelect(schema: string): string {
    return `SELECT expense.id, expense.category_id, category.code AS category_code,
      category.name AS category_name, category.is_active AS category_is_active,
      category.is_system AS category_is_system,
      expense.supplier_id, supplier.name AS supplier_name,
      supplier.is_system AS supplier_is_system,
      expense.status, expense.recurrence_type, expense.occurred_on::text,
      expense.description, expense.reference, expense.amount::text, expense.notes,
      expense.receipt_file_key, expense.confirmed_at, expense.cancelled_at,
      expense.created_by_user_id, expense.updated_by_user_id,
      expense.created_at, expense.updated_at
      FROM ${schema}.expenses expense
      JOIN ${schema}.expense_categories category ON category.id = expense.category_id
      JOIN ${schema}.suppliers supplier ON supplier.id = expense.supplier_id`;
  }

  private toSummary(row: ExpenseRow): ExpenseSummaryResponseDto {
    return {
      id: row.id,
      category: {
        id: row.category_id,
        code: row.category_code,
        name: row.category_name,
        isActive: row.category_is_active,
        isSystem: row.category_is_system,
      },
      supplier: {
        id: row.supplier_id,
        commercialName: row.supplier_name,
        isDefault: row.supplier_is_system,
      },
      status: row.status,
      recurrenceType: row.recurrence_type,
      occurredOn: row.occurred_on,
      description: row.description,
      reference: row.reference,
      amount: row.amount,
      notes: row.notes,
      receiptFileKey: row.receipt_file_key,
      confirmedAt: row.confirmed_at,
      cancelledAt: row.cancelled_at,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toStatusHistory(row: ExpenseStatusHistoryRow): ExpenseStatusHistoryResponseDto {
    return {
      id: row.id,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      changedByUserId: row.changed_by_user_id,
      changedByName: row.changed_by_name,
      changedAt: row.changed_at,
    };
  }

  private escapeLike(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  }
}
