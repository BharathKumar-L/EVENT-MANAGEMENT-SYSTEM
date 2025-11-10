# Event Management System

## Project Abstract

The Event Management System is a comprehensive, full-stack web application designed to facilitate the creation, management, and execution of events. This production-grade application provides a robust platform for event organizers and attendees, featuring seamless ticket management, user authentication, and detailed analytics.

## System Architecture

### Frontend (Client)
The client-side application is built with modern web technologies, providing a responsive and intuitive user interface.

**Core Technologies:**
- **React 18**: Frontend library for building user interfaces
- **Vite**: Next-generation frontend tooling
- **Tailwind CSS**: Utility-first CSS framework
- **React Router DOM**: Client-side routing

**Key Features:**
- Event creation and management
- Calendar view for event scheduling
- Ticket purchasing system
- User account management
- Payment processing interface
- Responsive design
- QR code generation for tickets

**Frontend Dependencies:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.12.1",
  "react-icons": "^4.10.1",
  "axios": "^1.7.7",
  "date-fns": "^2.30.0",
  "qrcode": "^1.5.3"
}
```

### Backend (API)
The server-side application is built with Node.js and Express, providing a secure and scalable REST API.

**Core Technologies:**
- **Node.js**: Runtime environment
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling

**Security Features:**
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting
- **hpp**: HTTP Parameter Pollution protection

**Backend Dependencies:**
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.6.1",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "morgan": "^1.10.0"
}
```

### Infrastructure
The application is deployed on Azure Cloud with infrastructure managed through Terraform.

**Cloud Infrastructure:**
- **Azure App Service**: PremiumV2 tier for application hosting
- **Azure Blob Storage**: GRS (Geo-Redundant Storage) for media files
- **Azure Container Registry**: Docker image registry

**DevOps Tools:**
- **Docker**: Application containerization
- **Terraform**: Infrastructure as Code
- **NGINX**: Web server and reverse proxy

### Database Schema

**Event Model:**
- Owner (String, indexed)
- Title (String)
- Description (String)
- OrganizedBy (String)
- EventDate (Date, indexed)
- EventTime (String)
- Location (String)
- TicketPrice (Number)
- Quantity (Number)
- Participants (Number)
- Income (Number)
- Likes (Number)
- Comments (Array)
- Image (String)

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting for API endpoints
- Security headers with Helmet
- Private blob storage
- FTPS disabled
- System-assigned managed identity

## Scalability Features
- Premium V2 App Service Plan
- Elastic worker support (up to 3 instances)
- Geo-redundant storage
- Always-on configuration
- Container-based deployment

## Development Workflow
1. Local development using Docker Compose
2. Code versioning with Git
3. Infrastructure provisioning with Terraform
4. Automated builds with Docker
5. Configuration management using environment variables

## Future Considerations
- Implement CI/CD pipelines
- Add real-time event updates using WebSocket
- Integrate with additional payment gateways
- Implement event analytics dashboard
- Add support for recurring events