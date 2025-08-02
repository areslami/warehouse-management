'use client';

import { useEffect, useState } from 'react';

export default function FinancePage() {
    const [message, setMessage] = useState('Loading...');

    useEffect(() => {
        fetch('http://localhost:8000/finance/')
            .then((res) => res.json())
            .then((data) => setMessage(data.message))
            .catch(() => setMessage('Failed to fetch data'));
    }, []);

    return (
        <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>Finance</h1>
            <p>{message}</p>
        </main>
    );
}
