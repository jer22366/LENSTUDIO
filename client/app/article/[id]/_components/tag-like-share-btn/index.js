'use client'

import React, { useState, useEffect } from 'react'
import styles from './index.module.scss'
import Link from 'next/link'

// 假設 currentUserId 可從某處獲取，這裡暫時硬編碼為 1
const currentUserId = 1

export default function TagLikeShareBtnIndex({ articleId }) {
  const [tags, setTags] = useState([])
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0) // 初始值從後端取得
  const [isHovered, setIsHovered] = useState(false) // 追蹤 Like 按鈕 hover
  const [isClicked, setIsClicked] = useState(false) // 追蹤 Like 按鈕 active
  // 新增分享按鈕 hover 與 active 狀態
  const [shareHovered, setShareHovered] = useState(false)
  const [shareActive, setShareActive] = useState(false)
  // 新增 Share popup 狀態
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [copyHovered, setCopyHovered] = useState(false)
  const [copyActive, setCopyActive] = useState(false)

  useEffect(() => {
    // 取得標籤
    const fetchTags = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}/tags`)
        if (!response.ok) {
          console.log('response', response)
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setTags(data)
      } catch (error) {
        console.error('Could not fetch tags:', error)
      }
    }

    // 取得文章的初始 like_count
    const fetchArticleLikeCount = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setLikeCount(Number(data.like_count) || 0)
      } catch (error) {
        console.error('Could not fetch article like count:', error)
      }
    }

    fetchTags()
    fetchArticleLikeCount()
  }, [articleId])

  // 當使用者按讚，僅能按一次
  const handleLike = async () => {
    if (isLiked) return // 已按讚，不重複
    setIsLiked(true)
    const newLikeCount = Number(likeCount) + 1
    setLikeCount(newLikeCount)
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 300)

    try {
      const response = await fetch(`/api/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likeableId: articleId,
          likeableType: 'article',
          newLikeCount,
          userId: currentUserId,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error updating like count:', error)
    }
  }

  // 分享按鈕點擊事件：彈出一個置中 overlay 並提供複製網址功能
  const handleShare = () => {
    setShowSharePopup(true)
  }

  return (
    <>
      <div
        className={`d-flex justify-content-between align-items-center ${styles['y-tag-like-comment-share-fav-area']}`}
      >
        <div className={`${styles['y-tag-area']}`}>
          {tags.map((tag, index) => (
            <Link
              key={index}
              href={`/article?tag=&search=%23${tag.tag_name.replace('#', '')}`}
              className="text-decoration-none"
            >
              <button className="py-sm-1 px-sm-3 ms-sm-1 fw-medium rounded-pill">
                {tag.tag_name}
              </button>
            </Link>
          ))}
        </div>
        <div className={`${styles['y-like-comment-share-fav']} d-flex`}>
          {/* Like 按鈕 */}
          <button
            className="py-sm-2 px-sm-2 d-flex align-items-center fw-medium rounded-pill"
            onClick={handleLike}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src={
                isLiked
                  ? '/images/article/thumb-up-red.svg'
                  : isHovered
                  ? '/images/article/thumb-up-gray.svg'
                  : '/images/article/thumb-up-black.svg'
              }
              className={`me-1 ${styles['y-like-comment-share-fav-pc']}`}
              style={{
                transform: isClicked ? 'scale(1.5)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
              alt="Like"
            />
            {/* 電腦版數字 */}
            <span
              className={`${styles['y-count-num-pc']}`}
            >{`${likeCount}`}</span>
            <img
              src={
                isLiked
                  ? '/images/article/thumb-up-red.svg'
                  : isHovered
                  ? '/images/article/thumb-up-gray.svg'
                  : '/images/article/thumb-up-black.svg'
              }
              className={`me-1 ${styles['y-like-comment-share-fav-mb']}`}
              style={{
                transform: isClicked ? 'scale(1.5)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
              alt="Like"
            />
            <span className={`${styles['y-count-num']}`}>{`${likeCount}`}</span>
          </button>

          {/* Share 按鈕 */}
          <button
            className="py-sm-2 px-sm-2 d-flex align-items-center fw-medium rounded-pill"
            onClick={handleShare}
            onMouseEnter={() => setShareHovered(true)}
            onMouseLeave={() => {
              setShareHovered(false)
              setShareActive(false)
            }}
            onMouseDown={() => setShareActive(true)}
            onMouseUp={() => setShareActive(false)}
          >
            <img
              src={
                shareActive
                  ? '/images/article/share-active.svg'
                  : shareHovered
                  ? '/images/article/share-hover.svg'
                  : '/images/article/share-origin.svg'
              }
              className={`me-1 ${styles['y-like-comment-share-fav-pc']}`}
              alt="Share"
            />
            <img
              src={
                shareActive
                  ? '/images/article/share-active.svg'
                  : shareHovered
                  ? '/images/article/share-hover.svg'
                  : '/images/article/share-origin.svg'
              }
              className={`me-1 ${styles['y-like-comment-share-fav-mb']}`}
              alt="Share"
            />
          </button>

          {/* Favourite 按鈕 */}
          <button className="py-sm-2 px-sm-2 d-flex align-items-center fw-medium rounded-pill">
            <img
              src="/images/article/favourite.svg"
              className={`me-1 ${styles['y-like-comment-share-fav-pc']}`}
              alt="Favorite"
            />
            <img
              src="/images/article/favourite.svg"
              className={`me-1 ${styles['y-like-comment-share-fav-mb']}`}
              alt="Favorite"
            />
          </button>
        </div>
      </div>

      {showSharePopup && (
        <div
          onClick={() => setShowSharePopup(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          {/* 點擊白色區域不會關閉 popup */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: '70px',
              borderRadius: '15px',
              textAlign: 'center',
              width: '600px', // 框變長一些
            }}
          >
            <h5>複製以下網址分享</h5>
            <div
              style={{
                position: 'relative',
                width: '100%',
                margin: '20px auto',
              }}
            >
              <input
                type="text"
                readOnly
                value={window.location.href}
                style={{
                  width: '100%',
                  padding: '5px 50px 5px 10px', // 預留右側空間給複製按鈕
                  borderRadius: '10px',
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  setCopyActive(true)
                  setTimeout(() => setCopyActive(false), 5000)
                }}
                onMouseEnter={() => setCopyHovered(true)}
                onMouseLeave={() => setCopyHovered(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {(copyHovered || copyActive) && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '120%', // 顯示在按鈕正上方
                      right: 0,
                      background: '#7E7267',
                      color: 'white',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copyActive ? '已複製' : '複製'}
                  </div>
                )}
                <img
                  src={
                    copyActive
                      ? '/images/article/copy-active.svg'
                      : copyHovered
                      ? '/images/article/copy-hover.svg'
                      : '/images/article/copy-origin.svg'
                  }
                  alt="複製"
                  style={{ height: '70%' }}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
