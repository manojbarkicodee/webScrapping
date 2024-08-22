# Web Scraping Tool for Yellow Pages Contacts

This project is a web scraping tool designed to extract contact information from the Yellow Pages website. It features a user-friendly interface where users can input search parameters, initiate the scraping process, and view or download the collected data. The application comprises a frontend built with React.js and a backend powered by Node.js and Express, with MongoDB as the database for storing the scraped data.

## Overview

The Web Scraping Tool allows users to efficiently collect contact information such as names, addresses, phone numbers, and emails from the Yellow Pages website based on specified search criteria. The application provides options to view the scraped data directly within the interface or download it in CSV format for offline use.

## Features

- **User-Friendly Interface**: Easy-to-use frontend where users can input search terms and parameters.
- **Efficient Scraping**: Backend service that efficiently scrapes data from Yellow Pages and handles large volumes of information.
- **Data Storage**: Scraped data is stored securely in a MongoDB database for quick access and retrieval.
- **Data Export**: Option to download the collected data in CSV format.
- **Dockerized Deployment**: Supports running the entire application using Docker for easy deployment and scalability.

## Setup

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js (Latest Version)**: [Download Node.js](https://nodejs.org/en/download/)
- **Docker**: [Download Docker](https://www.docker.com/get-started)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/vlabzdev/Web-scrapping-tool.git
cd Web-scrapping-tool
mkdir web-scrapping-mongo

```
#### 2. Backend Setup (Local)

```bash
cd backend
npm install
npm run start
```
#### 3. Frontend Setup (Local)

```bash
cd frontend
npm install
npm run start
```
### 4. Docker Deployment

- **Execute the build.sh script to build the application using Docker.**

- **Execute the deploy.sh script to deploy the application using Docker.**

