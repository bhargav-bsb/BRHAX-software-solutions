const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Create data directory
const dataDir = path.join(__dirname, 'data', 'projects');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// API Endpoint to receive form data
app.post('/api/submit', (req, res) => {
    try {
        const projectData = req.body;
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `project-${timestamp}.json`;
        const filepath = path.join(dataDir, filename);
        
        // Save to file
        fs.writeFileSync(filepath, JSON.stringify(projectData, null, 2));
        
        // Log to console
        console.log('\n🎉 NEW PROJECT SUBMISSION!');
        console.log('=======================');
        console.log(`Project: ${projectData.projectName}`);
        console.log(`Type: ${projectData.websiteType}`);
        console.log(`Email: ${projectData.email}`);
        console.log(`Time: ${projectData.submittedAt}`);
        console.log(`File: ${filename}`);
        console.log('=======================\n');
        
        // Send response
        res.json({
            success: true,
            message: 'Project saved successfully!',
            filename: filename,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving project'
        });
    }
});

// API to get all projects
app.get('/api/projects', (req, res) => {
    try {
        const files = fs.readdirSync(dataDir);
        const projects = files.map(file => {
            const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
            return JSON.parse(content);
        });
        
        res.json({
            success: true,
            count: projects.length,
            projects: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reading projects'
        });
    }
});

// API to get stats
app.get('/api/stats', (req, res) => {
    try {
        const files = fs.readdirSync(dataDir);
        const stats = {
            total: files.length,
            today: files.filter(file => {
                const fileDate = new Date(file.split('-')[1] + '-' + file.split('-')[2]);
                const today = new Date();
                return fileDate.toDateString() === today.toDateString();
            }).length,
            byType: {}
        };
        
        // Count by website type
        files.forEach(file => {
            const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
            const data = JSON.parse(content);
            const type = data.websiteType || 'other';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting stats'
        });
    }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Data directory: ${dataDir}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`📡 API Endpoint: http://localhost:${PORT}/api/submit`);
    console.log('\n✅ Ready to receive project submissions!');
});