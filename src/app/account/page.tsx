"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { UnderlinedButton } from "../components/UnderlinedButton";
import { CustomInput } from "../components/CustomInput";
import { OrderDetailsItem } from "../components/OrderDetailsItem";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckoutCartItem } from "../components/CheckoutCartItem";
import { useQuery, useMutation } from "react-query";
import { fetchUserInfo, updateUserInfo } from "../../services/user";
import { fetchAllOrders } from "../../services/orders";
import useCartStore from "@/services/store";
import { Spin, message } from "antd"; // Import Spin and message from Ant Design

type FormData = {
  fullName: string;
  phone: string;
};

export default function Account() {
  const [isEditing, setIsEditing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const { register, handleSubmit, setValue } = useForm<FormData>();
  const router = useRouter();

  // Fetch user info using useQuery
  const {
    data: userInfo,
    isLoading: isLoadingUserInfo,
    error: userError,
    refetch: refetchUserInfo,
  } = useQuery("userInfo", fetchUserInfo, {
    onSuccess: (data) => {
      setValue("fullName", data.fullName);
      setValue("phone", data.phone);
    },
    onError: (error: any) => {
      console.error("Error fetching user info:", error);
      message.error("Failed to fetch user information.");
    },
  });

  // Fetch all orders using useQuery
  const {
    data: ordersData,
    error: ordersError,
    isLoading: ordersLoading,
  } = useQuery("orders", () => fetchAllOrders(1), {
    onError: (error: any) => {
      console.error("Failed to fetch all orders:", error);
      message.error("Failed to load orders.");
    },
  });

  // Update user info using useMutation
  const updateUserMutation = useMutation(updateUserInfo, {
    onMutate: () => {
      message.loading("Updating user information...");
    },
    onSuccess: () => {
      setIsEditing(false); // End editing mode
      refetchUserInfo(); // Refetch user data to ensure UI updates with the latest data
      message.success("User information updated successfully.");
    },
    onError: (error: any) => {
      console.error("Error updating user info:", error);
      message.error("Failed to update user information.");
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    updateUserMutation.mutate(data); // Use mutation to update user info
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleLogout = () => {
    try {
      // Clear the cart using the clearCart method from useCartStore
      const { clearCart } = useCartStore.getState();
      clearCart();

      // Remove authentication-related data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      // Use router to navigate to the login page
      router.push("/account/login");
      message.success("Logged out successfully.");
    } catch (error) {
      console.error("Error during logout and cart clear:", error);
      message.error("Failed to log out. Please try again.");
    }
  };

  // Toggle order details
  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className="flex flex-col items-start py-8 px-4 md:py-20 md:px-20">
      <div className="flex flex-col my-4 md:my-10">
        <h1 className="text-[#454545] font-normal uppercase tracking-[.2em] text-lg md:text-xl mb-[14px]">
          MY ACCOUNT
        </h1>
      </div>
      <div className="flex flex-col md:flex-row w-full gap-4 md:gap-16">
        <div className="flex flex-col w-full my-4 md:my-[50px] flex-[6]">
          <h1 className="w-full block text-[11px] font-light uppercase tracking-[.2em] text-[#9D9D9D] pb-[10px] mb-[34px] border-b border-solid border-b-[#e3e3e3]">
            MY ORDERS
          </h1>
          <div className="w-full text-[14px] text-[#454545] font-normal">
            {ordersLoading && (
              <div className="flex justify-center items-center py-4">
                <Spin size="large" /> {/* Loading Spinner for orders */}
              </div>
            )}
            {ordersError && <p>Failed to load orders.</p>}
            {ordersData?.content.map((order: any) => (
              <div
                key={order.id}
                className="mb-4 border border-solid border-[#e3e3e3] cursor-pointer"
                onClick={() => toggleOrderDetails(order.id)}
              >
                {/* Order Card */}
                <div className="py-2 px-4 flex flex-col">
                  <div className="flex flex-row justify-between">
                    <p className="text-[14px] font-semibold text-[#454545]">
                      No {order.id}
                    </p>
                    <p className="text-[14px] font-medium text-[#454545]">
                      {order.totalSum} UZS
                    </p>
                  </div>
                  <div className="flex flex-row justify-between my-2">
                    <p className="text-xs font-normal text-[#9d9d9d]">
                      {order.createdTime}
                    </p>
                    <p
                      className={`text-[14px] font-medium ${
                        order.isPaid ? "text-green-500" : "text-[#CB2B2B]"
                      } uppercase`}
                    >
                      {order.isPaid
                        ? "Paid"
                        : !order.isPaid && order.paymentType === "uzum nasiya"
                        ? "Pending"
                        : "Not Paid"}
                    </p>
                  </div>
                </div>

                {/* Collapsible Section for Order Details */}
                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div
                      key="order-details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 py-2 flex flex-col gap-5"
                    >
                      <div className="flex flex-col">
                        <h1 className="text-[14px] font-semibold text-[#454545]">
                          Order Details
                        </h1>
                        <OrderDetailsItem
                          title="Full Name"
                          description={order.userFullName}
                        />
                        <OrderDetailsItem
                          title="Phone"
                          description={order.phone}
                        />
                        <OrderDetailsItem
                          title="Address"
                          description={order.address}
                        />
                        <OrderDetailsItem
                          title="Delivery Type"
                          description={order.isDelivery ? "Delivery" : "Pickup"}
                        />
                        <OrderDetailsItem
                          title="Comments"
                          description={order.comments}
                        />
                      </div>
                      <div className="flex flex-col">
                        <h1 className="text-[14px] font-semibold text-[#454545]">
                          Payment Information
                        </h1>
                        <OrderDetailsItem
                          title="Payment Type"
                          description={order.paymentType}
                        />
                        {order.paymentType === "CASH" ? (
                          " "
                        ) : (
                          <OrderDetailsItem
                            title="Payment Link"
                            description={order.paymentLink}
                            isDescriptionLink
                          />
                        )}
                        {order.paymentType === "uzum nasiya" && (
                          <OrderDetailsItem
                            title="Status"
                            description="Pending"
                          />
                        )}
                      </div>
                      <div className="flex flex-col mt-2 gap-3">
                        <h2 className="text-[14px] font-semibold text-[#454545]">
                          Order Items
                        </h2>
                        {order.itemsList.map((item: any, index: number) => (
                          <CheckoutCartItem
                            key={index}
                            title={item.nameRu}
                            price={item.totalPrice}
                            quantity={item.quantity}
                            image={item.imageName}
                          />
                        ))}
                        <div className="w-full flex flex-col gap-2">
                          <div className="flex flex-row justify-between text-[19px] font-semibold text-[#454545]">
                            <p>Total</p>
                            <p>{order.totalSum} UZS</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col my-4 md:my-[50px] flex-[4]">
          <div className="w-full">
            <h1 className="w-full block text-[11px] font-light uppercase tracking-[.2em] text-[#9D9D9D] pb-[10px] mb-[34px] border-b border-solid border-b-[#e3e3e3]">
              PROFILE
            </h1>
            {!isEditing ? (
              <div className="flex flex-col md:flex-row items-start justify-between">
                <div className="mb-4 md:mr-6">
                  <p className="text-[#454545] font-normal text-[14px]">
                    Name: {userInfo?.fullName}
                  </p>
                  <p className="text-[#1c1313] font-normal text-[14px]">
                    Phone number: {userInfo?.phone}
                  </p>
                </div>
                <UnderlinedButton title="Edit" onClick={handleEditClick} />
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
              >
                <CustomInput
                  {...register("fullName")}
                  title="ФИО"
                  borders="no-rounded"
                  type="text"
                />
                <CustomInput
                  {...register("phone", { required: true })}
                  title="Номер телефона"
                  borders="no-rounded"
                  type="text"
                />
                <button
                  type="submit"
                  className="w-full bg-[#454545] p-[14px] font-semibold text-xl text-white"
                >
                  Save
                </button>
              </form>
            )}
            <div className="border-t border-solid border-t-[#e3e3e3] mt-10 md:mt-20">
              <button
                onClick={handleLogout}
                className="uppercase text-[11px] text-[#9D9D9D] tracking-[.2em] font-normal mb-[25px] text-start"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
