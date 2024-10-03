import React, { useState, useEffect } from 'react';
import AxiosInstance from './AxiosInstance';
import Header from './Header';
import Toolbar from './Toolbar';
import Dailies from './Dailies';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import '../css/log.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClose } from '@fortawesome/free-solid-svg-icons';

const Log = () => {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ start: new Date(), end: null });
  const [isRange, setIsRange] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchLogs();
  }, [date, dateRange, isRange, sortConfig]);

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
      let sortedLogs = response.data.map(log => ({
        ...log,
        project: log.project_id, // Rename project_id to project
        process: log.phase_name, // Rename asset_phase to process
        "man-days": log.man_days, // Rename man-days to man_days
      }));
  
      if (sortConfig.key) {
        sortedLogs = [...sortedLogs].sort((a, b) => {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];
      
          // Handle case where the sort key is the date
          if (sortConfig.key === 'date') {
            // Parse date strings into Date objects for accurate comparison
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
      
            // Compare dates first
            if (dateA.getTime() !== dateB.getTime()) {
              return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }
      
            // If dates are equal, sort by id
            return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
          }
      
          // Convert strings to lowercase for case-insensitive comparison
          if (typeof aValue === 'string') aValue = aValue.toLowerCase();
          if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
          // Compare the primary key (sortConfig.key)
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          
          return 0;
        });
      }      
      setLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error.response || error.message || error);
    }
  };

  const handleDateChange = (date) => {
    setDate(date);
    setDateRange({ start: null, end: null });
  };

  const formatDate_Range = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDate = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);

    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
    const year = parsedDate.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleRangeChange = (e) => {
    const isChecked = e.target.checked;
    
    setIsRange(isChecked);
    if (isChecked) {
      setLogs([]);
      setDate(null);
      setDateRange({ start: null, end: null });
    } else {
      setDate(new Date());
      setDateRange({ start: new Date(), end: null });
    }
  };

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className='landing'>
      <Header />
      <Toolbar 
        isRange={isRange}
        date={date}
        dateRange={dateRange}
        handleRangeChange={handleRangeChange}
        handleDateChange={handleDateChange}
        setDateRange={setDateRange}
        formatDate={formatDate}
        formatDate_Range={formatDate_Range}  
      />
      <main>
        <div className='log' style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
          {!isRange ? (
            <Dailies 
              isRange={isRange}
              date={date}
              openModal={openModal}
              closeModal={closeModal}
            />
          ) : (
            <table>
              <thead>
                <tr>
                  {['Date', 'Employee Name', 'Project', 'Asset Name', 'Asset Type', 'Process', 'Man-days', 'Status', 'Description', 'Image'].map((header, index) => (
                    <th 
                      key={header}
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => handleSort(header.toLowerCase().replace(/ /g, '_'))}
                    >
                      {header}
                      {sortConfig.key === header.toLowerCase().replace(/ /g, '_') && (
                        <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.date)}</td>
                      <td>{log.employee_name}</td>
                      <td title={log.project_name}>{log.project_id}</td>
                      <td>{log.asset_name}</td>
                      <td>{log.asset_type}</td>
                      <td>{log.phase_name}</td>
                      <td>{log.man_days}</td>
                      <td>{log.status}</td>
                      <td className='des' title={log.description}><div className="description-cell" >{log.description}</div></td>
                      <td>
                        <div className='thumbnail'>
                        {log.image_url && (
                          <img 
                            src={`${AxiosInstance.defaults.baseURL}/api/image/${log.image_url}`} 
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
                    <td colSpan="10">No logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
      {modalImage && (
          <div 
            style={{
              position: 'fixed',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
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
          {/* <button 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              background: 'transparent', 
              border: 'none', 
              fontSize: '1.2rem', 
              cursor: 'pointer',
              color: 'white',
            }} 
            onClick={closeModal}
          >
            <FontAwesomeIcon icon={faClose} />
          </button> */}
        </div>
      )}
    </div>
  );
};

export default Log;
