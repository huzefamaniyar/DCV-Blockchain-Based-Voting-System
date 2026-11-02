# 🗳️ Decentralized Voting dApp

A full-stack blockchain-based voting application with face recognition authentication, built with React, Node.js, MongoDB, and Ethereum smart contracts.

---

## 🌟 Features

### Core Functionality

- ✅ **Face Recognition Authentication** - Biometric login and voting verification
- ✅ **Blockchain Voting** - Immutable vote records on Ethereum
- ✅ **Real-time Updates** - Live vote counting via Socket.IO
- ✅ **Dual Authentication** - Password + Face recognition
- ✅ **One Vote Per Person** - Aadhaar-based duplicate prevention
- ✅ **Email Notifications** - Vote confirmations via NodeMailer
- ✅ **PDF/CSV Export** - Downloadable election results
- ✅ **Image Management** - Cloudinary integration for candidate photos
- ✅ **Admin Panel** - Election creation and management
- ✅ **MetaMask Integration** - Wallet-based blockchain interaction

### Security

- 🔒 Bcrypt password hashing
- 🔒 JWT token authentication
- 🔒 Face descriptor storage (not images)
- 🔒 Aadhaar hash on blockchain
- 🔒 Role-based access control
- 🔒 Protected API routes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                    │
│  - Face Recognition (Face-API.js)                           │
│  - MetaMask Integration (ethers.js)                         │
│  - Real-time Updates (Socket.IO Client)                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                │
│  - REST API                                                 │
│  - Face Recognition Verification                            │
│  - JWT Authentication                                       │
│  - Socket.IO Server                                         │
│  - Email Notifications                                      │
└─────┬──────────────────┬──────────────────┬─────────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
┌──────────┐    ┌──────────────┐    ┌─────────────────┐
│ MongoDB  │    │  Cloudinary  │    │ Ethereum (Local)│
│  - Users │    │  - Images    │    │  - Smart        │
│  - Data  │    │              │    │    Contract     │
└──────────┘    └──────────────┘    └─────────────────┘
```

---

## 📁 Project Structure

```
DCV_FPJ/
├── Hardhat/                    # Blockchain
│   ├── contracts/
│   │   └── VotingSystem.sol   # Main voting smart contract
│   ├── scripts/
│   │   └── deploy.js          # Deployment script
│   └── hardhat.config.js
│
├── Server/                     # Backend
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Feedback.js        # Feedback schema
│   ├── routes/
│   │   ├── auth.js            # Authentication
│   │   ├── face.js            # Face recognition
│   │   ├── election.js        # Elections
│   │   ├── feedback.js        # Feedback
│   │   └── upload.js          # Image upload
│   ├── server.js              # Main server
│   └── .env                   # Environment config
│
└── Frontend/                   # React App
    ├── src/
    │   ├── components/        # Reusable components
    │   ├── pages/             # Page components
    │   ├── context/           # React context
    │   ├── utils/             # Helper functions
    │   ├── styles/            # CSS files
    │   └── App.jsx            # Main app
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB
- MetaMask browser extension
- Webcam (for face recognition)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd DCV_FPJ
```

2. **Install dependencies**

```bash
# Backend
cd Server
npm install

# Frontend
cd ../Frontend
npm install

# Hardhat (already installed)
cd ../Hardhat
```

3. **Configure environment variables**

Create `Server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting_dapp_db
JWT_SECRET=your-secret-key
FACE_MATCH_THRESHOLD=0.6

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Voting dApp <noreply@votingdapp.com>

# Blockchain (update after deployment)
HARDHAT_NETWORK_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=
ADMIN_PRIVATE_KEY=
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. **Start MongoDB**

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. **Deploy Smart Contract**

```bash
cd Hardhat

# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

Copy the contract address and update `Server/.env`

6. **Start Backend**

```bash
cd Server
npm run dev
```

7. **Start Frontend**

```bash
cd Frontend
npm run dev
```

8. **Access the application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

---

## 🎮 Usage

### For Users

1. **Register**
   - Fill registration form with Aadhaar details
   - Register your face for biometric authentication
   - Connect MetaMask wallet

2. **Login**
   - Use password or face recognition
   - Verify wallet connection

3. **Vote**
   - Browse active elections
   - Verify your face before voting
   - Select candidate and confirm
   - Receive email confirmation

4. **View Results**
   - See live vote counts
   - Download PDF/CSV reports
   - Share election links

### For Admins

1. **Create Election**
   - Set title and timeframe
   - Add 2-50 candidates
   - Upload candidate images
   - Deploy to blockchain

2. **Manage Elections**
   - Delete upcoming/closed elections
   - Monitor voting activity
   - View feedback from users

---

## 🔧 Technology Stack

### Frontend

- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **ethers.js** - Blockchain interaction
- **Face-API.js** - Face recognition
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **jsPDF** - PDF generation
- **React Toastify** - Notifications

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time server
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT auth
- **Cloudinary** - Image storage
- **NodeMailer** - Email service
- **Multer** - File upload

### Blockchain

- **Solidity 0.8.28** - Smart contract language
- **Hardhat** - Development environment
- **ethers.js** - Blockchain library
- **MetaMask** - Wallet integration

---

## 📊 API Endpoints

### Authentication

```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login with password
GET    /api/auth/verify         - Verify JWT token
POST   /api/auth/update-wallet  - Update wallet address
GET    /api/auth/profile        - Get user profile
```

### Face Recognition

```
POST   /api/face/register-face      - Register face descriptor
POST   /api/face/authenticate       - Login with face
POST   /api/face/verify-for-voting  - Verify face before voting
```

### Elections

```
POST   /api/election/create      - Create election (Admin)
GET    /api/election/all         - Get all elections
GET    /api/election/:id         - Get election details
DELETE /api/election/:id         - Delete election (Admin)
POST   /api/election/vote        - Cast vote
GET    /api/election/:id/results - Get results
```

### Feedback

```
POST   /api/feedback/submit      - Submit feedback
GET    /api/feedback/all         - Get all feedback (Admin)
GET    /api/feedback/my-feedback - Get user's feedback
PUT    /api/feedback/:id         - Update feedback (Admin)
```

### Upload

```
POST   /api/upload/image    - Upload single image
POST   /api/upload/images   - Upload multiple images
DELETE /api/upload/image/:id - Delete image
```

---

## 🔐 Smart Contract

### VotingSystem.sol

**Key Functions:**

- `createElection()` - Create new election
- `vote()` - Cast vote with Aadhaar verification
- `deleteElection()` - Delete election (conditional)
- `getElection()` - Get election details
- `getCandidates()` - Get all candidates
- `getResults()` - Get election results
- `updateElectionStatus()` - Update status based on time

**Security Features:**

- Admin-only functions
- One vote per address
- One vote per Aadhaar
- Timestamp-based status
- Event emissions

---

## 🧪 Testing

### Create Admin Account

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "admin123",
    "age": 25,
    "gender": "male",
    "aadhaarNumber": "123456789012",
    "address": "Admin Address",
    "wardNumber": "1",
    "role": "admin"
  }'
```

### Test Flow

1. Register admin account
2. Register face
3. Connect MetaMask
4. Create election
5. Register user account
6. User registers face
7. User votes
8. Check email confirmation
9. View results
10. Export PDF/CSV

---

## 📱 MetaMask Setup

1. Install MetaMask extension
2. Import Hardhat account (Account #0 private key)
3. Add Hardhat network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency: ETH

---

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
net start MongoDB
mongosh  # Verify connection
```

### Face Recognition Not Working

- Ensure good lighting
- Allow camera permissions
- Wait for models to load (10-20s)
- Use Chrome/Edge browser

### MetaMask Not Connecting

- Check network (Chain ID: 1337)
- Ensure account has ETH
- Clear MetaMask cache

### Contract Deployment Failed

- Ensure Hardhat node is running
- Check network configuration
- Verify gas settings

---

## 📚 Documentation

- **Setup Guide**: `PROJECT_SETUP.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Authors

Decentralized Voting dApp Team

---

## 🙏 Acknowledgments

- Face-API.js for face recognition
- Hardhat for blockchain development
- Cloudinary for image storage
- MongoDB for database
- React community

---

## 📞 Support

For issues and questions:

- Check documentation files
- Review error logs
- Test with provided examples
- Contact admin via feedback system

---

## 🎯 Roadmap

- [x] Core voting system
- [x] Face recognition
- [x] Blockchain integration
- [x] Real-time updates
- [x] Email notifications
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Testnet deployment
- [ ] Mainnet deployment

---

**🎉 Happy Voting!**

# Built with ❤️ using React, Node.js, MongoDB, Solidity, and Face-API.js
