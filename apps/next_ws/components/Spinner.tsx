import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = '#004dff' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-11 h-11',
        lg: 'w-16 h-16',
    };

    return (
        <div className='min-h-screen flex justify-center items-center'>
            <div className={`spinner ${sizeClasses[size]} relative`}>
                {[...Array(6)].map((_, index) => (
                    <div
                        key={index}
                        className="absolute w-full h-full border-2"
                        style={{ borderColor: color, backgroundColor: `${color}33` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Spinner;