body {
  font-family: Arial, sans-serif;
  background: linear-gradient(to bottom right, #ffdde1, #ee9ca7);
  margin: 0;
  padding: 20px;
  color: #333;
}

header {
  text-align: center;
}

.header-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
}

.content {
  max-width: 800px;
  margin: auto;
}

.floating-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #e74c3c;
  color: #fff;
  font-size: 24px;
  padding: 15px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1000;
}

.menu-buttons {
  position: fixed;
  bottom: 90px;
  right: 20px;
  display: none;
  flex-direction: column;
  gap: 10px;
  z-index: 999;
}

.menu-btn {
  background: #3498db;
  color: white;
  padding: 10px;
  border-radius: 8px;
  text-decoration: none;
  text-align: center;
}

.menu-btn:hover {
  background: #2980b9;
}

.home-button {
  display: block;
  width: fit-content;
  margin: 20px auto;
  padding: 10px 20px;
  background: #2ecc71;
  color: white;
  text-decoration: none;
  border-radius: 10px;
}

.testimonial-list {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  max-width: 700px;
  margin: auto;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.testimonial-item {
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.testimonial-item:last-child {
  border-bottom: none;
}
