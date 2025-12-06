# 🚀 Deployment Guide: Smart Document Hub

This guide will walk you through deploying your **Frontend to Vercel** and your **Backend to Render**.

---

## 📋 Prerequisites

1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Vercel Account**: For deploying the frontend (Free).
3.  **Render Account**: For deploying the backend (Free tier available).

---

## 🛠️ Step 1: Push Code to GitHub

1.  Open your terminal in the project root (`ocr-11`).
2.  Run these commands to save your changes:
    ```bash
    git add .
    git commit -m "Ready for deployment"
    git push origin main
    ```

---

## ⚙️ Step 2: Deploy Backend (Render)

Since your backend uses **Tesseract OCR**, we need a platform that supports Docker. **Render** is perfect for this.

1.  **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com/).
2.  **New Web Service**: Click **"New +"** -> **"Web Service"**.
3.  **Connect GitHub**: Select "Build and deploy from a Git repository" and choose your `ocr-11` repo.
4.  **Configure Service**:
    *   **Name**: `ocr-backend` (or similar)
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: Select **Docker**.
    *   **Region**: Choose the one closest to you (e.g., Singapore or Frankfurt).
    *   **Free Tier**: Select the "Free" instance type.
5.  **Environment Variables**:
    *   Click "Advanced" or "Environment".
    *   Add `CORS_ORIGINS` with value `*` (or your frontend URL later).
6.  **Deploy**: Click **"Create Web Service"**.

⏳ **Wait**: The build will take a few minutes. Once done, copy the **onrender.com URL** (e.g., `https://ocr-backend.onrender.com`). You will need this for the frontend!

---

## 🎨 Step 3: Deploy Frontend (Vercel)

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com/).
2.  **Add New Project**: Click **"Add New..."** -> **"Project"**.
3.  **Import Git Repository**: Find your `ocr-11` repo and click **"Import"**.
4.  **Configure Project**:
    *   **Framework Preset**: It should auto-detect "Create React App".
    *   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   **Key**: `REACT_APP_BACKEND_URL`
    *   **Value**: Paste your Render Backend URL (e.g., `https://ocr-backend.onrender.com`).
        *   *Note: Do not add a trailing slash `/`.*
6.  **Deploy**: Click **"Deploy"**.

🎉 **Success!** Vercel will build your site and give you a live URL (e.g., `https://ocr-11.vercel.app`).

---

## 🔄 Step 4: Final Connection

1.  Go back to your **Render Dashboard** (Backend).
2.  Go to **Environment** settings.
3.  Update `CORS_ORIGINS` to your new **Vercel Frontend URL** (e.g., `https://ocr-11.vercel.app`).
    *   *This improves security by only allowing your frontend to talk to your backend.*
4.  **Save Changes**. Render will restart the server.

---

## ✅ You are Live!
Open your Vercel URL and test the application.
