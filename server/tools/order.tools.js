import {
  getOrderByNumber,
  getUserOrders,
} from "../services/order.service.js";

export async function getOrderStatus(orderNumber, userId) {
  const order = await getOrderByNumber(orderNumber, userId);

  if (!order) {
    return {
      found: false,
      message: "Order not found.",
    };
  }

  return {
    found: true,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    items: order.items,
  };
}

export async function getMyOrders(userId) {
  const orders = await getUserOrders(userId);

  if (!orders.length) {
    return {
      found: false,
      message: "You don't have any orders.",
    };
  }

  return {
    found: true,
    count: orders.length,
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt,
    })),
  };
}