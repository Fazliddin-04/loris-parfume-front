"use client";
import React, { useState, useEffect, useRef } from "react";
import { BiBasket } from "react-icons/bi";
import { CustomDropdown } from "../components/CustomDropdown";
import { CustomInput } from "../components/CustomInput";
import { CheckoutCartItem } from "../components/CheckoutCartItem";
import CustomTextArea from "../components/CustomTextArea";
import useCartStore from "../../services/store";
import useOrderStore from "../../services/orderStore";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation } from "react-query";
import { createOrder, OrderData } from "../../services/orders";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import YandexMap from "../components/TYandexMap";

const options = [
  { id: 0, title: "Самовывоз" },
  { id: 1, title: "Доставка" },
];

const paymentOptions = [
  { id: 0, title: "cash" },
  { id: 1, title: "uzum nasiya" },
  { id: 2, title: "payme" },
  { id: 3, title: "click" },
];

type FormData = {
  fullName: string;
  phone: string;
  branch: string;
  address: string;
  comment: string;
  paymentType: string;
  deliveryType: string;
};

export default function Checkout() {
  const { cart, totalSum } = useCartStore((state) => state);
  const { addOrder } = useOrderStore();
  const { handleSubmit, setValue, control, register } = useForm<FormData>();
  const [isDelivery, setIsDelivery] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const router = useRouter();
  const loadingBarRef = useRef<LoadingBarRef | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Define the mutation using React Query
  const mutation = useMutation(
    (orderData: OrderData) => createOrder(orderData),
    {
      onMutate: () => {
        loadingBarRef.current?.continuousStart();
      },
      onSuccess: (data) => {
        loadingBarRef.current?.complete();
        addOrder(data);

        // Check if the payment type is "Uzum Nasiya"
        if (data.paymentType.toLowerCase() === "uzum nasiya") {
          alert("Answer for your request will be sent to your phone number");
        } else if (
          data.paymentType.toLowerCase() === "click" ||
          data.paymentType.toLowerCase() === "payme"
        ) {
          window.location.href = data.paymentLink;
        } else {
          alert("Order created successfully!");
          router.push("/account");
        }
      },
      onError: (error) => {
        loadingBarRef.current?.complete();
        console.error("Failed to create order:", error);
        alert("Failed to create order, please try again.");
      },
    }
  );

  const handleDeliveryChange = (value: string) => {
    setIsDelivery(value === "Доставка");
    setValue("deliveryType", value);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const ordersItemsList = cart.map((item) => ({
      itemId: item.id,
      sizeId: item.sizeId ?? 0,
      quantity: item.quantity,
      collectionId: item.collectionId ?? 0,
    }));

    const orderData: OrderData = {
      fullName: data.fullName,
      branchId: parseInt(data.branch),
      address: data.address,
      addressLocationLink: `http://maps.google.com/?q=${encodeURIComponent(
        data.address
      )}`,
      distance: 5.0,
      phone: data.phone,
      comment: data.comment,
      isDelivery: data.deliveryType === "Доставка",
      isSoonDeliveryTime: false,
      scheduledDeliveryTime: new Date().toISOString(),
      longitude: longitude || 0.0,
      latitude: latitude || 0.0,
      deliverySum: 0.0,
      totalSum: totalSum(),
      paymentType: data.paymentType.toLowerCase(),
      returnUrl: "/",
      ordersItemsList: ordersItemsList,
    };

    mutation.mutate(orderData);
  };

  return (
    <section className="px-5 md:px-8 lg:px-16">
      <LoadingBar color="#87754f" ref={loadingBarRef} />
      <div className="py-2">
        <header className="flex flex-row justify-between items-center md:px-[104px] py-4 md:py-[21px]">
          <Link href="/">
            <h1 className="text-lg md:text-xl lg:text-[21px] font-medium text-[#454545]">
              Loris Parfume
            </h1>
          </Link>
          <Link href={`/cart`}>
            <BiBasket className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </Link>
        </header>
        <hr className="border-solid border-t-[1px] border-t-[#DFDFDF] -mx-5 md:-mx-[104px]" />
        <div className="relative flex flex-col lg:flex-row md:px-16 md:py-4">
          <div className="flex-[6] flex flex-col gap-4 border-b lg:border-b-0 lg:border-r-[1px] border-solid border-[#DFDFDF] md:p-10">
            <h1 className="text-lg md:text-xl lg:text-[21px] font-medium text-[#454545]">
              Доставка
            </h1>
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <CustomDropdown
                name="deliveryType"
                options={options}
                title="Тип доставки"
                control={control}
                onChange={handleDeliveryChange}
              />
              <YandexMap
                onCoordinatesChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />

              <CustomInput
                {...register("fullName")}
                type="text"
                borders="rounded"
                title="ФИО"
              />
              <CustomInput
                {...register("phone")}
                type="text"
                borders="rounded"
                title="Номер телефона"
              />
              <CustomInput
                {...register("branch")}
                type="text"
                borders="rounded"
                title="Филиал"
              />
              <CustomInput
                {...register("address")}
                type="text"
                borders="rounded"
                title="Адрес"
              />
              <CustomTextArea
                {...register("comment")}
                borders="rounded"
                title="Комментарий"
              />
              <CustomDropdown
                name="paymentType"
                options={paymentOptions}
                title="Тип оплаты"
                control={control}
              />
              <button
                type="submit"
                className="w-full bg-[#454545] p-[14px] font-semibold text-lg md:text-xl text-white rounded-[5px]"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading ? "Processing..." : "Сделать оплату"}
              </button>
            </form>

            <footer className="border-t border-solid border-t-[#DFDFDF] mt-4 lg:mt-16">
              <a href="#" className="mt-2 underline text-primary">
                Privacy
              </a>
            </footer>
          </div>
          <div className="flex-[4] p-4 md:p-10 lg:h-[300px] lg:sticky top-0 right-0 left-0">
            <div className="w-full flex flex-col gap-5">
              {cart.map((cartItem, index) => {
                const discountPrice = cartItem.discountPercent
                  ? cartItem.price -
                    (cartItem.price * cartItem.discountPercent) / 100
                  : cartItem.price;
                return (
                  <CheckoutCartItem
                    key={`${cartItem.id}-${cartItem.sizeId}-${cartItem.price}-${index}`}
                    title={cartItem.nameRu}
                    subtitle={cartItem.sizeNameRu}
                    price={discountPrice}
                    quantity={cartItem.quantity}
                    image={cartItem.imagesList[0]}
                  />
                );
              })}
              <div className="w-full flex flex-col gap-2">
                <div className="flex flex-row justify-between text-base md:text-[19px] font-semibold text-[#454545]">
                  <p>Total</p>
                  <p>UZS {isMounted ? totalSum() : 0} сум</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
