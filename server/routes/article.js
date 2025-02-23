import { Router } from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: 'localhost',
  user: 'admin',
  password: '12345',
  database: 'lenstudio',
})

//cors設定
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}

const router = Router()
router.use(cors(corsOptions))

// 取得所有文章或篩選文章
router.get('/', async (req, res) => {
  const { year, month, category, search, tag, user_id } = req.query

  let query = `
    SELECT 
      a.*,
      c.name AS category_name,
      GROUP_CONCAT(t.tag_name SEPARATOR ',') AS tags,
      u.nickname,
      u.name AS author_name,
      CASE
        WHEN t.tag_name = ? THEN 1
        WHEN a.title LIKE ? THEN 2
        WHEN a.content LIKE ? THEN 3
        ELSE 4
      END AS relevance
    FROM article a
    LEFT JOIN article_category c ON a.category_id = c.id
    LEFT JOIN article_tags at ON a.id = at.article_id
    LEFT JOIN tag t ON at.tag_id = t.id
    JOIN users u ON a.user_id = u.id
  `

  const conditions = []
  // 前三個參數對應 CASE 判斷
  const queryParams = [
    tag || '',            // CASE WHEN t.tag_name = ?
    `%${search || ''}%`,  // WHEN a.title LIKE ?
    `%${search || ''}%`,  // WHEN a.content LIKE ?
  ]

  if (year) {
    conditions.push('YEAR(a.created_at) = ?')
    queryParams.push(year)
  }
  if (month) {
    conditions.push('MONTH(a.created_at) = ?')
    queryParams.push(month)
  }
  if (category) {
    conditions.push('a.category_id = ?')
    queryParams.push(category)
  }
  if (user_id) {
    conditions.push('a.user_id = ?')
    queryParams.push(user_id)
  }
  // 改用搜尋條件 (非 tag 時) 搜尋 tag、標題、內文
  if (search && !tag) {
    conditions.push('(t.tag_name LIKE ? OR a.title LIKE ? OR a.content LIKE ?)')
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  // 如果是點擊 tag 搜尋，則在 HAVING 判斷該文章是否含該 tag，但保留所有 tag
  if (tag) {
    query += ' GROUP BY a.id HAVING FIND_IN_SET(?, tags)'
    queryParams.push(tag)
  } else {
    query += ' GROUP BY a.id'
  }

  query += ' ORDER BY relevance ASC, a.created_at DESC'

  try {
    const [rows] = await pool.query(query, queryParams)
    res.status(200).json({ status: 'success', data: rows })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message || '取得文章失敗',
    })
  }
})

// 取得最新文章
router.get('/latest', cors(corsOptions), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, c.name as category_name
      FROM article a
      LEFT JOIN article_category c ON a.category_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 4
    `)
    res.json({ data: rows })
  } catch (error) {
    console.error('Error fetching latest articles:', error)
    res.status(500).json({ error: 'Error fetching latest articles' })
  }
})

// 取得所有文章分類
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM article_category')
    res.status(200).json({
      status: 'success',
      data: rows,
      message: '取得所有文章分類成功',
    })
  } catch (err) {
    console.error('Error getting categories:', err)
    res.status(500).json({
      status: 'error',
      message: err.message ? err.message : '取得文章分類失敗',
    })
  }
})

// 取得所有文章年份
router.get('/years', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT YEAR(created_at) as year FROM article ORDER BY year DESC'
    )
    res.status(200).json({
      status: 'success',
      data: rows,
      message: '取得所有年份成功',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message ? err.message : '取得年份失敗',
    })
  }
})

// 取得文章的標籤
router.get('/:articleId/tags', async (req, res) => {
  const { articleId } = req.params
  console.log('Fetching tags for article:', articleId) // 加入除錯
  try {
    const [articleTags] = await pool.query(
      'SELECT tag_id FROM article_tags WHERE article_id = ?',
      [articleId]
    )
    console.log('articleTags:', articleTags)

    if (!articleTags.length) {
      return res.json([])
    }

    const tagIds = articleTags.map((articleTag) => articleTag.tag_id)
    console.log('tagIds:', tagIds)

    const [tags] = await pool.query(
      'SELECT id, tag_name FROM tag WHERE id IN (?)',
      [tagIds]
    )
    res.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({ message: 'Error fetching tags' })
  }
})


// 取得指定文章
router.get('/:id', async (req, res) => {
  try {
    // 修改 SQL 查詢，加入 LEFT JOIN users
    const [rows] = await pool.query(
      `
      SELECT 
        a.*,
        c.name AS category_name,
        u.head AS user_head,
        u.nickname AS user_nickname,
        u.name AS user_name
      FROM article a
      LEFT JOIN article_category c ON a.category_id = c.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
      `,
      [req.params.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `找不到${req.params.id}文章`,
      })
    }

    const article = rows[0]

    // 整理回傳的使用者資料
    const userData = {
      head: article.user_head,
      nickname: article.user_nickname,
      name: article.user_name,
    }

    // 將使用者資料放入回傳的 data 中
    res.status(200).json({
      status: 'success',
      data: {
        ...article,
        category_name: article.category_name, // 保留 category_name
        user: userData,
      },
      message: `取得${req.params.id}文章成功`,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message ? err.message : '連結伺服器錯誤',
    })
  }
})

router.post('/related', cors(corsOptions), async (req, res) => {
  const { categoryId, title, content, articleId } = req.body
  const limit = 4 // 設定文章數量上限
  try {
    let query = `
      SELECT a.*, c.name as category_name
      FROM article a
      LEFT JOIN article_category c ON a.category_id = c.id
      WHERE 1=1
    `
    let params = []

    // ★ 在第一個查詢就排除當前文章
    if (articleId) {
      query += ` AND a.id != ?`
      params.push(parseInt(articleId, 10))
    }

    // 1. 關鍵字條件
    if (title || content) {
      query += ` AND (a.title LIKE ? OR a.content LIKE ?)`
      params.push(`%${title}%`)
      params.push(`%${content}%`)
    }

    let [rows] = await pool.query(query, params)

    // 2. 推送同類別文章
    if (rows.length < limit && categoryId) {
      let categoryQuery = `
        SELECT a.*, c.name as category_name
        FROM article a
        LEFT JOIN article_category c ON a.category_id = c.id
        WHERE a.category_id = ?
      `
      let categoryParams = [categoryId]

      // ★ 同樣排除當前文章
      if (articleId) {
        categoryQuery += ` AND a.id != ?`
        categoryParams.push(parseInt(articleId, 10))
      }

      const [categoryRows] = await pool.query(categoryQuery, categoryParams)

      const combinedRows = [...rows]
      for (const categoryRow of categoryRows) {
        if (!combinedRows.find((row) => row.id === categoryRow.id)) {
          combinedRows.push(categoryRow)
        }
      }
      rows = combinedRows
    }

    // 3. 推送最新文章
    if (rows.length < limit) {
      let latestQuery = `
        SELECT a.*, c.name as category_name
        FROM article a
        LEFT JOIN article_category c ON a.category_id = c.id
        WHERE a.id != ?
        ORDER BY a.created_at DESC
        LIMIT ?
      `
      let latestParams = [parseInt(articleId, 10), limit - rows.length]

      const [latestRows] = await pool.query(latestQuery, latestParams)

      const combinedRows = [...rows]
      for (const latestRow of latestRows) {
        if (!combinedRows.find((row) => row.id === latestRow.id)) {
          combinedRows.push(latestRow)
        }
      }
      rows = combinedRows
    }

    res.json({ data: rows.slice(0, limit) })
  } catch (error) {
    console.error('Error fetching related articles:', error)
    res.status(500).json({ error: 'Error fetching related articles' })
  }
})

router.post('/like', async (req, res) => {
  const { articleId, likeCount } = req.body
  try {
    const [result] = await pool.query(
      'UPDATE article SET like_count = ? WHERE id = ?',
      [likeCount, articleId]
    )
    // 可印出 result 來檢查影響的列數
    console.log('Update result:', result)
    res.status(200).json({ status: 'success', likeCount })
  } catch (err) {
    console.error('Error updating like count:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})


// 新增文章
router.post('/', async (req, res) => {
  const { category, title, subtitle, content, image_path, hashtags } = req.body

  // 檢查圖片路徑格式（若有輸入才檢查）
  if (image_path && image_path.trim() && !image_path.startsWith('https://')) {
    return res.status(400).json({
      status: 'error',
      message: '圖片路徑必須以 https:// 開頭',
    })
  }

  let connection // 聲明 connection 變數
  try {
    connection = await pool.getConnection() // 取得連線
    await connection.beginTransaction()

    // 修改 HTML 內容，將 background-color: rgb(255, 255, 255) 替換為 background-color: transparent
    const transparentContent = content.replace(
      /background-color:\s*rgb\(255,\s*255,\s*255\)/gi,
      'background-color: transparent'
    )

    // 新增文章資料，id 為 AUTO_INCREMENT，自動產生
    const articleQuery = `
      INSERT INTO article (category_id, title, subtitle, content, image_path, created_at, update_time)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `
    const [articleResult] = await connection.query(articleQuery, [
      category || null,
      title || null,
      subtitle || null,
      transparentContent || null,
      image_path || null,
    ])
    const articleId = articleResult.insertId // 使用 LAST_INSERT_ID() 得到新文章 id

    // 如果有 hashtag 資料，依序處理每個 tag
    if (Array.isArray(hashtags) && hashtags.length) {
      for (const tagNameRaw of hashtags) {
        const tagName = tagNameRaw.trim()
        if (!tagName) continue

        // 檢查 tag 是否存在
        const [existingTags] = await connection.query(
          'SELECT id FROM tag WHERE tag_name = ?',
          [tagName]
        )

        let tagId
        if (existingTags.length) {
          tagId = existingTags[0].id
        } else {
          // 如不存在則先寫入 tag 資料表
          const [tagResult] = await connection.query(
            'INSERT INTO tag (tag_name) VALUES (?)',
            [tagName]
          )
          tagId = tagResult.insertId
        }

        // 將新文章的 id 與 tagId 寫入 article_tag 資料表
        await connection.query(
          'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
          [articleId, tagId]
        )
      }
    }

    await connection.commit()

    res.status(201).json({
      status: 'success',
      message: '新增文章成功',
      articleId,
    })
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackErr) {
        console.error('Rollback 錯誤:', rollbackErr)
        // 檢查連線是否已關閉，如果已關閉，則重新建立連線
        if (rollbackErr.code === 'PROTOCOL_CONNECTION_LOST') {
          console.error('資料庫連線已關閉，嘗試重新連線...')
          connection = await pool.getConnection()
        }
      }
    }
    console.error('Error adding article:', err)
    res.status(500).json({
      status: 'error',
      message: err.message ? err.message : '新增文章失敗',
    })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

// 更新指定文章
router.put('/:id', async (req, res) => {
  try {
    //此為初步測試 實際的新增邏輯請根據需求補上，例如取得 req.body 資料
    res.status(200).json({
      status: 'success',
      message: `更新文章ID: ${req.params.id}成功`,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message ? err.message : '更新文章失敗TAT',
    })
  }
})

// 刪除指定文章
router.delete('/:id', async (req, res) => {
  try {
    //此為初步測試 實際的新增邏輯請根據需求補上，例如取得 req.body 資料
    res.status(200).json({
      status: 'success',
      message: `刪除文章ID: ${req.params.id}成功`,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message ? err.message : '刪除文章失敗~',
    })
  }
})

export default router
