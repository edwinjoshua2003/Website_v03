import React, { useState, useEffect } from 'react';
import AxiosInstance from './AxiosInstance';
import Header from './Header';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import './log.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const Log = () => {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ start: new Date(), end: null });
  const [isRange, setIsRange] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [date, dateRange, isRange]);

  const fetchLogs = async () => {
    let url = '/api/logs';
    if (isRange && dateRange.start && dateRange.end) {
      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');
      url += `?start_date=${startDate}&end_date=${endDate}`;
    } else if (date) {
      const selectedDate = format(date, 'yyyy-MM-dd');
      url += `?date=${selectedDate}`;
    } else {
      return;
    }

    try {
      const response = await AxiosInstance.get(url);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error.response || error.message || error);
    }
  };

  const handleDateChange = (date) => {
    setDate(date);
    setDateRange({ start: null, end: null });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleRangeChange = (e) => {
    const isChecked = e.target.checked;
    
    setIsRange(isChecked);
    if (isChecked) {
      // Clear logs and set dateRange start and end to null when range checkbox is checked
      setLogs([]);
      setDate(null);
      setDateRange({ start: null, end: null });
    } else {
      // Show current date by default when range checkbox is unchecked
      setDate(new Date());  // Set the current date
      setDateRange({ start: new Date(), end: null });  // Set start date to current date, end date to null
    }
  };
  

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  return (
    <div className='landing'>
      <Header />
        <div className='main_top'>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            Range
            <input 
              type="checkbox" 
              checked={isRange} 
              onChange={handleRangeChange} 
              style={{ width: '40px', verticalAlign: 'middle' }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ marginRight: '20px' }}>
              <label style={{ marginBottom: '10px' }}>Start Date</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '110px' }}>
                <input
                  type="text"
                  value={isRange ? formatDate(dateRange.start) : formatDate(date)}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '5px 30px 5px 10px',
                    fontSize: '1em',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
                <div 
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    cursor: 'pointer',
                    zIndex: 1000 // Ensure the DatePicker is fully visible
                  }}
                >
                  <DatePicker
                    selected={isRange ? dateRange.start : date}
                    onChange={(date) => isRange ? setDateRange({ ...dateRange, start: date }) : handleDateChange(date)}
                    maxDate={new Date()} // Disables future dates
                    customInput={<FontAwesomeIcon icon={faCalendarAlt} />}
                    popperPlacement="bottom-end" // Adjust the position of the DatePicker
                  />
                </div>
              </div>
            </div>

            <div style={{ marginRight: '20px' }}>
              <label style={{ marginBottom: '10px' }} >End Date</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '110px' }}>
                <input
                  type="text"
                  value={formatDate(dateRange.end)}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '5px 30px 5px 10px',
                    fontSize: '1em',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                  disabled={!isRange}
                />
                <div 
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    cursor: isRange ? 'pointer' : 'not-allowed', 
                    zIndex: 1000 // Ensure the DatePicker is fully visible
                  }}
                >
                  <DatePicker
                    selected={dateRange.end}
                    onChange={(date) => setDateRange({ ...dateRange, end: date })}
                    minDate={dateRange.start}
                    maxDate={new Date()}
                    selectsEnd
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    disabled={!isRange}
                    customInput={<FontAwesomeIcon icon={faCalendarAlt} />}
                    popperPlacement="bottom-end" // Adjust the position of the DatePicker
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      <main>
        <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Date</th>
                <th style={{ textAlign: 'center' }}>Employee Name</th>
                <th style={{ textAlign: 'center' }}>Project</th>
                <th style={{ textAlign: 'center' }}>Asset Name</th>
                <th style={{ textAlign: 'center' }}>Asset Type</th>
                <th style={{ textAlign: 'center' }}>Process</th>
                <th style={{ textAlign: 'center' }}>Man-days</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Description</th>
                <th style={{ textAlign: 'center' }}>Image</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{log.date}</td>
                    <td>{log.employee_name}</td>
                    <td title={log.project_name}>{log.project_id}</td> {/* Display project_id, show project_name on hover */}
                    <td>{log.asset_name}</td>
                    <td>{log.asset_type}</td>
                    <td>{log.phase_name}</td>
                    <td>{log.eta}</td>
                    <td>{log.status}</td>
                    <td className='des' title={log.description}><div className="description-cell" >{log.description}</div></td>
                    <td>
                      <div className='thumbnail'>
                      {log.image_url && (
                        <img 
                          src={`${AxiosInstance.defaults.baseURL}/api/image/${log.image_url}`} // Replace with the correct server URL if needed
                          alt="Log entry" 
                          style={{ cursor: 'pointer', maxWidth: '100px' }} 
                          onClick={() => openModal(`${AxiosInstance.defaults.baseURL}/api/image/${log.image_url}`)}
                        />
                      )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>No logs available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
        {modalImage && (
          <div 
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.5)',
              maxWidth: '100%',
              maxHeight: '100%',
              overflow: 'auto'
            }}
            onClick={closeModal}
          >
          <img 
            src={modalImage} 
            alt="Expanded log entry" 
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
          <button 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              background: 'transparent', 
              border: 'none', 
              fontSize: '1.5em', 
              cursor: 'pointer'
            }} 
            onClick={closeModal}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default Log;
