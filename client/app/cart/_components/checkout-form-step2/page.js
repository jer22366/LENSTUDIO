import { useState } from "react";
import styles from "./shopping-cart-step2.module.scss";
import { useRouter } from "next/navigation";

export default function CheckoutFormStep2() {
    const router = useRouter();
    const [formData, setFormData] = useState({
      
        name: "",
        address: "",
        phone: ""
    });

    const [errors, setErrors] = useState({}); // 用來存放錯誤訊息

    // 處理輸入變更
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // 即時移除錯誤訊息
        setErrors({
            ...errors,
            [e.target.name]: ""
        });
    };

    // 表單驗證
    const validateForm = () => {
        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            if (!formData[key].trim()) {
                newErrors[key] = "此欄位為必填";
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 提交表單
    const handleSubmit = () => {
        if (validateForm()) {
            localStorage.setItem("buyerData", JSON.stringify(formData));
            router.push("/cart/cart-step3");
        }
    };

    return (
        <div className={`${styles['j-payStep']} col-sm-10 col-md-9 col-lg-7 col-xl-6 col-xxl-5 mt-4 me-lg-0 `}>
            <div className={`${styles['j-payTitle']} mb-3`}>結帳</div>
            <div className={`${styles['buyerData']} mb-4`}>訂購人資料</div>
            <div className={`${styles['j-buyerInput']} d-flex flex-column mb-5`}>
                {[
                   
                    { label: "姓名*", name: "name" },
                    { label: "地址*", name: "address" },
                    { label: "電話號碼*", name: "phone" },
                ].map((field, index) => (
                    <div key={index} className="d-flex flex-column flex-grow-1 mb-2">
                        <p className="mb-2">{field.label}</p>
                        <input
                            type="text"
                            name={field.name}
                            className={`form-control focus-ring focus-ring-light ${errors[field.name] ? 'border-danger' : ''}`}
                            value={formData[field.name]}
                            onChange={handleChange}
                        />
                        {errors[field.name] && <small className="text-danger">{errors[field.name]}</small>}
                    </div>
                ))}
            </div>
            <div className={`${styles['j-Checkout']} d-flex justify-content-center align-items-center`}>
                <button
                    className={`${styles['j-btn']} btn text-alig-center d-flex flex-grow-1 justify-content-center`}
                    onClick={handleSubmit}
                >
                    繼續
                </button>
            </div>
        </div>
    );
}
