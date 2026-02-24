# Mingle — Containerised SaaS Backend

A RESTful backend service for a social/event platform, developed and deployed as part of a Cloud Computing module (2025).

This project demonstrates backend development, containerisation, cloud deployment, and secure authentication practices.

---

## 📌 Overview

Mingle is a Node.js-based API that allows users to register, authenticate, and manage events.  
The application is containerised using Docker and deployed on a Google Cloud Virtual Machine.

It was designed to follow modern cloud and DevOps practices, including environment-based configuration and reproducible deployments.

---

## 🏗 Architecture

Client (Postman / Frontend)  
↓  
REST API (Node.js / Express)  
↓  
MongoDB Database  
↓  
Docker Containers  
↓  
Google Cloud VM

---

## 🛠 Technology Stack

- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT, bcrypt
- Containerisation: Docker, Docker Compose
- Cloud Platform: Google Cloud VM
- Testing: Postman
- Version Control: Git, GitHub

---

## ⚙️ Key Features

### User Management
- User registration and login
- Password hashing with bcrypt
- JWT-based authentication

### Event Management
- Create and view events
- Join events with capacity limits
- Ownership and authorisation rules

### Security
- Protected API routes
- Token-based access control
- Environment-based configuration

### Deployment
- Dockerised application
- Multi-container setup with MongoDB
- Deployed on Google Cloud VM

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Docker
- Docker Compose
- Git

### Clone the Repository

```bash
git clone https://github.com/abdishakurabdi14/mingle-backend.git
cd mingle-backend
