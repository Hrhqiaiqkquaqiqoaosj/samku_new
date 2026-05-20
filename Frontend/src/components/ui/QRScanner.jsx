import { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, X, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

const QRScanner = ({ isOpen, onClose, onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !scanning) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError('');
      setScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start scanning for QR codes
      scanQRCode();
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Try to decode QR code using a simple pattern matching
    // In a real implementation, you'd use a library like jsQR
    try {
      // This is a simplified QR detection - in production use jsQR library
      const qrCode = detectQRCode(imageData);
      if (qrCode) {
        handleQRCodeDetected(qrCode);
        return;
      }
    } catch (err) {
      console.error('QR detection error:', err);
    }

    // Continue scanning
    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  // Simplified QR detection (replace with jsQR in production)
  const detectQRCode = (imageData) => {
    // This is a placeholder - implement actual QR detection
    // For demo purposes, we'll simulate detection after 3 seconds
    return null;
  };

  const handleQRCodeDetected = (qrData) => {
    console.log('QR Code detected:', qrData);
    setScanResult(qrData);
    setScanning(false);
    stopCamera();
    
    // Process the QR code
    processQRCode(qrData);
  };

  const processQRCode = async (qrData) => {
    setProcessing(true);
    setError('');

    try {
      // Extract charger ID from QR code
      let chargerId = qrData;
      
      // If QR contains URL, extract charger ID
      if (qrData.includes('/')) {
        const parts = qrData.split('/');
        chargerId = parts[parts.length - 1];
      }

      // Validate charger ID format
      if (!chargerId || chargerId.length < 3) {
        throw new Error('Invalid charger QR code');
      }

      // Call the success callback with charger ID
      if (onScanSuccess) {
        await onScanSuccess(chargerId);
      }

      // Close modal after successful processing
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);

    } catch (err) {
      console.error('Error processing QR code:', err);
      setError(err.message || 'Failed to process QR code');
    } finally {
      setProcessing(false);
    }
  };

  const resetState = () => {
    setScanResult('');
    setError('');
    setProcessing(false);
    setScanning(false);
  };

  const handleClose = () => {
    stopCamera();
    resetState();
    onClose();
  };

  // Manual input for testing
  const handleManualInput = () => {
    const testChargerId = prompt('Enter charger ID for testing (e.g., CH-001):');
    if (testChargerId) {
      handleQRCodeDetected(testChargerId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scan Charger QR Code"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManualInput}>
            Manual Input
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Camera View */}
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {scanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <QrCode size={48} className="mx-auto mb-2" />
                    <p className="text-sm">Position QR code within the frame</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Camera size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm opacity-75">Camera not active</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {scanResult && !error && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle size={20} />
            <span className="text-sm">QR Code detected: {scanResult}</span>
          </div>
        )}

        {processing && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            <Zap size={20} className="animate-pulse" />
            <span className="text-sm">Processing charging request...</span>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium">How to scan:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Point your camera at the charger's QR code</li>
            <li>Make sure the QR code is clearly visible and well-lit</li>
            <li>Hold steady until the code is detected</li>
            <li>The charging session will start automatically</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default QRScanner; 