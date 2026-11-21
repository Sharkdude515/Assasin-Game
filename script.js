* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0d0f14;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #fff;
  touch-action: none;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* HUD */
#hud {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 10;
  background: rgba(15, 18, 25, 0.78);
  padding: 10px 16px;
  border-left: 4px solid #c92a2a;
  border-radius: 6px;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

#hud h1 {
  font-size: 15px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ff6b6b;
}

#hud p {
  font-size: 13px;
  margin-top: 4px;
  color: #dee2e6;
}

#status {
  font-weight: bold;
  color: #51cf66;
}

#controls-hint {
  font-size: 11px;
  margin-top: 6px;
  color: #adb5bd;
}

/* Assassination Prompt */
#prompt {
  position: absolute;
  top: 32%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(201, 42, 42, 0.92);
  padding: 8px 18px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 0.5px;
  display: none;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 4px 15px rgba(201, 42, 42, 0.5);
}

/* End Screen Modal */
#message {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  z-index: 30;
}

#message h2 {
  font-size: 30px;
  margin-bottom: 10px;
}

#message p {
  color: #ced4da;
  max-width: 340px;
}

#message button {
  margin-top: 18px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background: #c92a2a;
  color: white;
  border: none;
  border-radius: 6px;
}

/* Mobile Touch Overlay */
#touch-ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 15;
  display: none;
}

#joystick-zone {
  position: absolute;
  bottom: 24px;
  left: 24px;
  width: 120px;
  height: 120px;
  pointer-events: auto;
}

#joystick-base {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.25);
  position: relative;
}

#joystick-stick {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

#action-buttons {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  pointer-events: auto;
}

.btn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:active, .btn.active {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0.95);
}

.btn-strike {
  width: 68px;
  height: 68px;
  font-size: 13px;
  background: rgba(201, 42, 42, 0.55);
  border-color: #ff6b6b;
}

.btn-strike:active {
  background: rgba(201, 42, 42, 0.9);
}
