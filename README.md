# Chat App Backend

Backend for the chat application, built with Node.js, Express, and MongoDB.

## Frontend
Frontend repository: https://github.com/binio152/hepiverse-frontend

## Main Technologies
- Node.js
- Express.js
- TypeScript
- MongoDB (via Mongoose)
- Socket.IO
- JWT (for authentication)
- Cloudinary (for file uploads)

## Requirements
- Node.js 18+ (20+ recommended)
- npm or yarn
- MongoDB instance

## Install
```bash
npm install
```
or
```bash
yarn install
```

## Environment Variables
Create a `.env` file in the backend folder:

```
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Run Project
```bash
npm run dev
```
or
```bash
yarn dev
```

Default server URL: `http://localhost:5001`.

## Scripts
- `npm run dev`: Start development server with nodemon
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run lint checks