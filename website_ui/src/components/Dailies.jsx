import React, { useState, useEffect } from 'react';
import AxiosInstance from './AxiosInstance';
import Header from './Header';
import { format } from 'date-fns';
import '../css/dailies.css'
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClose } from '@fortawesome/free-solid-svg-icons';

const Dailies = ({
  isRange, 
  date,
  openModal,
  closeModal
}) => {
  const [logs, setLogs] = useState([]);
  const [excludedEmployees, setExcludedEmployees] = useState([]); // State for excluded employees
  const [modalImage, setModalImage] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchLogs();
  }, [date, isRange, sortConfig]);

  const fetchLogs = async () => {
    let url = '/api/dailies';
    if (!isRange && date) {
      const selectedDate = format(date, 'yyyy-MM-dd');
      url += `?date=${selectedDate}`;
    } else {
      return;
    }

    try {
      const response = await AxiosInstance.get(url);
      const { current_logs, excluded_employees, absent_employees } = response.data;
  
      // Process and sort logs
      let sortedLogs = current_logs.map(log => ({
        ...log,
        project: log.project_id,
        process: log.phase_name,
        "man-days": log.man_days,
        isReported: true, // Add a flag for reported logs
        isAbsent: false,
      }));
  
      // Add excluded employees as unreported logs
      const unreportedLogs = excluded_employees.map(emp => ({
        id: `unreported-${emp.employee_id}`, // Give a unique ID for unreported logs
        date: '', // Empty date
        employee_name: emp.employee_name,
        project: '-',
        asset_name: '-',
        asset_type: '-',
        phase_name: '-',
        "man-days": '-',
        status: '-',
        description: 'Not Updated',
        isReported: false, // Add a flag for unreported logs
        isAbsent: false,
      }));

      const absentLogs = absent_employees.map(emp => ({
        id: `absent-${emp.employee_id}`, // Give a unique ID for unreported logs
        date: '', // Empty date
        employee_name: emp.employee_name,
        project: '-',
        asset_name: '-',
        asset_type: '-',
        phase_name: '-',
        "man-days": '-',
        status: '-',
        description: 'On Leave',
        isReported: false, // Add a flag for unreported logs
        isAbsent: true,
      }));
  
      // Combine both reported and unreported logs
      const allLogs = [...sortedLogs, ...unreportedLogs, ...absentLogs];
  
      // Apply sorting if necessary
      if (sortConfig.key === 'employee_name') {
        allLogs.sort((a, b) => {
          const aValue = typeof a[sortConfig.key] === 'string' ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
          const bValue = typeof b[sortConfig.key] === 'string' ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];
  
          if (sortConfig.key === 'date') {
            if (a.date === b.date) {
              return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
            }
          }
  
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
  
      setLogs(allLogs);
      setExcludedEmployees(excluded_employees);
    } catch (error) {
      console.error('Error fetching logs:', error.response || error.message || error);
    }
  };  

//   const formatDate = (date) => {
//     if (!date) return '';

//     const parsedDate = new Date(date);
//     const day = String(parsedDate.getUTCDate()).padStart(2, '0');
//     const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
//     const year = parsedDate.getUTCFullYear();
//     return `${day}/${month}/${year}`;
//   };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div 
      className='daily' style={{ zIndex: 50 }}>
      <table>
        <thead>
          <tr>
            {['Employee Name', 'Project', 'Asset Name', 'Asset Type', 'Process', 'Man-days', 'Status', 'Description', 'Image'].map((header) => (
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
            logs.reduce((acc, log, index, array) => {
              const isSameEmployee = index > 0 && log.employee_name === array[index - 1].employee_name;
              const rowSpanCount = array.filter(l => l.employee_name === log.employee_name).length;

              acc.push(
                <tr 
                  key={log.id} 
                  style={{ backgroundColor: log.isReported ? '' : log.isAbsent ? 'rgba(144, 222, 255, 0.2)' : 'rgba(255, 0, 0, 0.2)' }}
                  // className={ log.isReported ? '' : log.isAbsent ? 'absent_row' : 'not_reported_row' }
                >
                  {/* Employee Name cell, only show if it's the first occurrence */}
                  {!isSameEmployee && (
                    <td rowSpan={rowSpanCount} className='merged_cell'>
                      {log.employee_name}
                    </td>
                  )}
                  <td title={log.project_name}>{log.project ? log.project : '-'}</td>
                  <td>{log.asset_name ? log.asset_name : '-'}</td>
                  <td>{log.asset_type ? log.asset_type : '-'}</td>
                  <td>{log.phase_name ? log.phase_name : '-'}</td>
                  <td>{log["man-days"] ? log["man-days"] : '-'}</td>
                  <td>{log.status ? log.status : '-'}</td>
                  <td className='des' title={log.description}>
                    <div className="description-cell">{log.description}</div>
                  </td>
                  <td>
                    {log.isReported && log.image_url && (
                      <div className='thumbnail'>
                        <img 
                          src={`${AxiosInstance.defaults.baseURL}/api/image/${log.image_url}`} 
                          alt="Log entry" 
                          style={{ cursor: 'pointer', maxWidth: '100px' }} 
                          onClick={() => openModal(`${AxiosInstance.defaults.baseURL}/api/image/${log.image_url}`)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
              return acc;
            }, [])
          ) : (
            <tr>
              <td colSpan="10">No logs found</td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* {modalImage && (
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
            zIndex: 9999,
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
        </div>
      )} */}
    </div>
  );
};

export default Dailies;