# Deploying Qualitivate.io to Alwaysdata

This guide helps you deploy the Qualitivate.io application to Alwaysdata. The project is set up as a monorepo, and we have configured the server to serve the client static files in production, simplifying the deployment to a single Node.js service.

## Prerequisites

1.  An [Alwaysdata](https://www.alwaysdata.com/) account.
2.  The `server` and `client` code ready locally.

## Deployment Steps

### 1. Database Setup

1.  Log in to your Alwaysdata administration panel.
2.  Go to **Databases** > **PostgreSQL**.
3.  Create a new **User** (e.g., `qualitivate_user`) with a password.
4.  Create a new **Database** (e.g., `qualitivate_production`) and assign the user you just created to it.
5.  Note down the connection details. You will need the **Connection URL** (or build it: `postgres://USER:PASSWORD@HOST/DATABASE`).

### 2. Configure Environment Variables

1.  Go to **Environment** > **Environment variables** (or handle this in the Application section later).
2.  Prepare the following variables:
    *   `NODE_ENV`: `production`
    *   `DATABASE_URL`: Your PostgreSQL connection string (from Step 1).
    *   `PORT`: `8100` (or whatever specific port Alwaysdata assigns, but usually you don't set this manually if using their standard Node.js generic setup, they pass it via env. However, if you are setting up a "User Program", sticking to the assigned port is key. For "Node.js" site type, see below).
    *   `JWT_SECRET`: A long random string for security.
    *   `FRONTEND_URL`: Your domain (e.g., `https://qualitivate.alwaysdata.net`).

### 3. Upload Files

You can use FTP, SFTP, or Git. Git is recommended.

**Option A: Using Git (Recommended)**
1.  Initialize a git repo if you haven't: `git init`, `git add .`, `git commit -m "Initial"`.
2.  Add Alwaysdata remote (found in **Web** > **Sites** > **Install application** usually, or setup SSH remote manually).
3.  Push your code to a folder on the server (e.g., `~/www/qualitivate`).

**Option B: Using SFTP**
1.  Upload the entire project folder to `~/www/qualitivate`.
    *   Include: `package.json`, `client/`, `server/`, `database/`.
    *   You can exclude `node_modules` (we will install them on server).

### 4. Application Configuration on Alwaysdata

1.  Go to **Web** > **Sites**.
2.  Edit your default site or create a new one.
3.  **Type**: `Node.js`.
4.  **Command**: `npm start --workspace=server`
    *   *Note*: This runs the start script defined in the root `package.json`.
5.  **Working Directory**: `/home/YOUR_USER/www/qualitivate` (The root of your project).
6.  **Environment Variables**: Add the variables from Step 2 here if the UI allows, or use a `.env` file in `server/.env`.
    *   **Crucial**: Ensure `DATABASE_URL` is set.

### 5. Build and Install

You need to install dependencies and build the project on the server.
1.  Connect via **SSH** to your Alwaysdata account.
2.  Navigate to your project folder:
    ```bash
    cd ~/www/qualitivate
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Build the project (Client and Server):
    ```bash
    npm run build
    ```
    *   This will compile the Node.js server to `server/dist`.
    *   This will compile the React client to `client/dist`.

### 6. Run Migrations

To set up the database tables:
1.  From the project root (via SSH):
    ```bash
    cd server
    npm run migrate
    ```

### 7. Restart Application

1.  Go back to the Alwaysdata panel (**Web** > **Sites**).
2.  **Restart** the Node.js site to apply changes.

### Troubleshooting

-   **Static Files Not Found**: Ensure you ran `npm run build` successfully. Check that `client/dist` exists.
-   **Database Errors**: Check `DATABASE_URL`. Ensure the user has permissions.
-   **blank page**: Check the browser console. If 404 on JS files, check the base path.
-   **Migration Fails**: Ensure `tsx` is installed (it is in devDependencies, so `npm install` should have installed it).

### Directory Structure

Ensure your server setup looks like this:
```
/www/qualitivate/
  ├── package.json
  ├── client/
  │   ├── dist/      <-- Created by build
  │   └── ...
  ├── server/
  │   ├── dist/      <-- Created by build
  │   └── ...
  └── database/      <-- Needed for migrations
```
