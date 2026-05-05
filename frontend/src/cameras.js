// Shared camera list — used by both LiveMonitor and Dashboard
export const CAMERAS = [
  { id: 'CAM-001', label: 'Loodswezen Canal',        location: 'Rotterdam, Netherlands', zone: 'Zone A', motion: true,  type: 'mjpeg', streamUrl: 'https://webcamrm.loodswezen.nl/cgi-bin/faststream.jpg?stream=full&fps=25' },
  { id: 'CAM-002', label: 'Fair Harbor Marina',       location: 'Long Island, New York',  zone: 'Zone A', motion: false, type: 'mjpeg', streamUrl: 'http://webcam.fairharbormarina.com/nphMotionJpeg?Resolution=640x480' },
  { id: 'CAM-003', label: 'Opatovice Recreation Park', location: 'South Moravia, CZ',     zone: 'Zone B', motion: true,  type: 'mjpeg', maskRight: true, streamUrl: 'http://koupaliste.velkeopatovice.cz/mjpg/video.mjpg' },
  { id: 'CAM-004', label: 'Meishan Scenic Area',      location: 'Chiayi, Taiwan',         zone: 'Zone C', motion: false, type: 'mjpeg', streamUrl: 'https://meishan.ysnp.gov.tw/axis-cgi/mjpg/video.cgi' },
  { id: 'CAM-005', label: "Yangmingshan Nat'l Park",  location: 'Taipei, Taiwan',          zone: 'Zone B', motion: false, type: 'mjpeg', streamUrl: 'https://ysp.ysnp.gov.tw/axis-cgi/mjpg/video.cgi' },
  { id: 'CAM-006', label: 'Anklam Town View',         location: 'Mecklenburg, Germany',   zone: 'Zone D', motion: false, type: 'mjpeg', streamUrl: 'http://webcam.anklam.de/axis-cgi/mjpg/video.cgi' },
]
