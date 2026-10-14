import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PermissionCode } from '../../permissions/permission.types';
import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { OrderResponseDto, UpdateOrderDto } from './dto/order.dto';
import { OrdersController } from './orders.controller';

const userWith = (...permissions: PermissionCode[]): AuthenticatedUser =>
  ({
    id: '02356ea5-21c1-42a3-8ba1-009ada74b7a9',
    role: PlatformRole.User,
    permissions,
  }) as AuthenticatedUser;

const orderResponse = (): OrderResponseDto =>
  ({
    id: '1ab8b8d0-4e0c-4cce-8fc0-e63025bf7448',
    totalCost: '65.00',
    grossProfit: '135.00',
    items: [
      {
        productServiceId: null,
        unitCost: '25.00',
        costAmount: '25.00',
        costLayers: [],
      },
      {
        productServiceId: '1bd271b7-592a-4eef-9bd2-68a512365017',
        unitCost: '40.00',
        costAmount: '40.00',
        costLayers: [{ lotId: 'lot' }],
      },
    ],
  }) as unknown as OrderResponseDto;

describe('OrdersController authorization', () => {
  const buildController = (response: OrderResponseDto) => {
    const orders = {
      getOne: jest.fn().mockResolvedValue(response),
      update: jest.fn().mockResolvedValue(response),
      changePaymentStatus: jest.fn().mockResolvedValue(response),
    };
    const permissions = {
      has: jest.fn((user: AuthenticatedUser, permission: PermissionCode) =>
        user.permissions.includes(permission),
      ),
      hasAny: jest.fn((user: AuthenticatedUser, required: readonly PermissionCode[]) =>
        required.some((permission) => user.permissions.includes(permission)),
      ),
      assertAny: jest.fn(),
      assert: jest.fn(),
    };
    return {
      controller: new OrdersController(orders as never, permissions as never),
      orders,
      permissions,
    };
  };

  it('allows an order editor to update a manual cost without requiring orders.create', async () => {
    const response = orderResponse();
    const { controller, orders, permissions } = buildController(response);
    const user = userWith('orders.view', 'orders.edit');
    const input = {
      items: [{ quantity: 1, unitCost: 25 }],
    } as UpdateOrderDto;

    const result = await controller.update(user, response.id, input);

    expect(orders.update).toHaveBeenCalledWith(user, response.id, input);
    expect(permissions.assert).not.toHaveBeenCalled();
    expect(result.items[0]?.unitCost).toBe('25.00');
    expect(result.items[1]?.unitCost).toBeNull();
    expect(result.items[1]?.costLayers).toEqual([]);
    expect(result.totalCost).toBeNull();
    expect(result.grossProfit).toBeNull();
  });

  it('redacts every cost from a read-only order viewer', async () => {
    const response = orderResponse();
    const { controller } = buildController(response);

    const result = await controller.getOne(userWith('orders.view'), response.id);

    expect(result.items.every((item) => item.unitCost === null)).toBe(true);
    expect(result.items.every((item) => item.costAmount === null)).toBe(true);
    expect(result.totalCost).toBeNull();
    expect(result.grossProfit).toBeNull();
  });

  it('accepts payment management through either supported permission policy', async () => {
    const response = orderResponse();
    const { controller, permissions } = buildController(response);
    const user = userWith('orders.manage_payment');

    await controller.changePaymentStatus(user, response.id, { isPaid: true });

    expect(permissions.assertAny).toHaveBeenCalledWith(user, [
      'orders.edit',
      'orders.manage_payment',
    ]);
  });
});
