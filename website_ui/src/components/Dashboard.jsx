import React, { useEffect, useState } from 'react';
import AxiosInstance from './AxiosInstance';
import { Link } from 'react-router-dom';
import Header from './Header'
import '../css/dashboard.css'

const Dashboard = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await AxiosInstance.get('/api/dashboard/');
                setProjects(response.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjects();
    }, []);

    return (
        <div>
            < Header />
            <main className='d'>
                <h2>Select Project</h2>
                <div className="projects-container" style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {projects.length > 0 ? (
                        projects.map(project => (
                            <Link to={`/project/${project.id}`} key={project.id} className='project-card'>
                                <img src={`./project_icon/${project.id}_icon.jpg`} alt="project-icon"/>
                                {/* <h3>{project.name}</h3> */}
                            </Link>
                        ))
                    ) : (
                        <p>No projects available</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
