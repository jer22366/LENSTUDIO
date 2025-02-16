"use client";
import Link from "next/link";
import styles from "./login.module.scss";
import React, { useState, useEffect } from "react";

export default function UserPage() {
  const appKey = "loginWithToken";
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 初始化 - 檢查是否已登入
  useEffect(() => {
    const savedToken = localStorage.getItem(appKey);
    if (savedToken) {
      try {
        const decodedUser = jwt_decode(savedToken);
        setToken(savedToken);
        setUser(decodedUser);
      } catch (error) {
        console.error("Token 解碼失敗", error);
        localStorage.removeItem(appKey);
      }
    }
  }, []);

  // 登入處理
  const handleLogin = async (e) => {
    e.preventDefault();
    const API = "http://localhost:8000/api/users/login";
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: email, password }),  // 修正為 account
      });
  
      const result = await res.json();
      if (result.status !== "success") throw new Error(result.message);
  
      const newToken = result.data.token;
      localStorage.setItem(appKey, newToken);
      setToken(newToken);
      setUser(jwt_decode(newToken));
  
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // 登出處理
  const handleLogout = async () => {
    const API = "http://localhost:3005/api/users/logout";
    if (!token) return;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status !== "success") throw new Error(result.message);

      localStorage.removeItem(appKey);
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <main className="container">
      <section>
        <div className="container">
          <div className="mb-5 text-center">
            <h3 className={styles.parent}>客戶登入</h3>
            <h6 className={styles.parent}>
              登入您的映相坊帳戶，享受所有個人化功能。
            </h6>
          </div>

          <div className={`row justify-content-center ${styles.marginTop}`}>
            {/* 左側 - 建立帳戶 */}
            <div className={`col-lg-6 ${styles.box} ${styles.column} me-4`}>
              <div className={styles.box1}>
                <h6>我沒有帳戶</h6>
                <h6>建立帳戶，享受個人化的購物體驗。</h6>
              </div>
              <div className={`${styles.start} mb-3`}>
                <div className={styles.box1}>
                  <ul>
                    <li>收藏我的最愛</li>
                    <li>查詢租賃時間</li>
                    <li>追查訂單進度</li>
                  </ul>
                </div>
                <div className={styles.box1}>
                  <Link href="/login/register">
                    <button className={`${styles.buttonBox} ${styles.marginTop33}`}>
                      建立帳戶
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 右側 - 登入帳戶 */}
            <div className={`col-lg-6 ${styles.box} ${styles.column} me-4`}>
              {token ? (
                <div className="text-center">
                  <h1>歡迎, {user?.name}</h1>
                  <img src={user?.head || "/images/user/1.jpg"} alt="大頭貼" />
                  <button onClick={handleLogout} className={styles.buttonBox}>
                    登出
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin}>
                  <div className={styles.box1}>
                    <h6>我已擁有帳戶</h6>
                  </div>
                  <div className={`${styles.box1} mb-2`}>
                    <label className={styles.label}>電子郵件</label>
                    <input
                      className={`form-control ${styles.inputField}`}
                      type="text"
                      placeholder="電子郵件"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className={`${styles.box1} mb-2`}>
                    <label className={styles.label}>密碼</label>
                    <input
                      className={`form-control ${styles.inputField}`}
                      type="password"
                      placeholder="密碼"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className={`${styles.box1} mb-2`}>
                    <button type="submit" className={`${styles.buttonBox} ${styles.start}`}>
                      登入
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
