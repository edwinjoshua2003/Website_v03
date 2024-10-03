import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AxiosInstance from './AxiosInstance';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';

const Header = () => {
    const navigate = useNavigate();
  
    const handleLogout = async () => {
      try {
        await AxiosInstance.post('/api/logout/');  // Make the logout request
        navigate('/login');  // Redirect to the login page after successful logout
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to logout. Please try again.');
      }
    };
  
    return (
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top" style={{ zIndex: 1000 }}>
        <Container fluid>
          <Navbar.Brand href="/dashboard">
            <img
              src="../logo512.png"
              alt=""
              width="60"
              height=""
              className="d-inline-block align-middle"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarNavDropdown" />
          <Navbar.Collapse id="navbarNavDropdown">
            <Nav className="me-auto" style={{fontSize: '16px', fontWeight: '400'}}>
              <Nav.Link href="/dashboard" className="nav-item 1">
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/project" className="nav-item 2">
                Daily Log
              </Nav.Link>
              {/* <Nav.Link href="/dailies" className="nav-item 3">
                Dailies
              </Nav.Link> */}
              <Nav.Link href="/log" className="nav-item 4">
                Log History
              </Nav.Link>
              <NavDropdown
                title="Other"
                id="navbarDropdownMenuLink"
                className="nav-item dropdown"
                style={{fontSize: '16px', fontWeight: '400'}}
              >
                <NavDropdown.Item href="/admin" className="bg-transparent text-black" style={{fontSize: '15px'}}>
                  New Page
                </NavDropdown.Item>
                <NavDropdown.Divider className="text-white" />
                <NavDropdown.Item href="#logout" onClick={handleLogout} className="bg-transparent text-black" style={{fontSize: '15px'}}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>    
    );
  };
  
  export default Header