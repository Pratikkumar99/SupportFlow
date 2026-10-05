import Order from "../models/Order.js";

export async function getOrderByNumber(orderNumber, userId) {
  const order = await Order.findOne({
    orderNumber,
    userId,
  });

  if (!order) {
    return null;
  }

  return order;
}

export async function getUserOrders(userId) {
  return await Order.find({
    userId,
  }).sort({ createdAt: -1 });
}