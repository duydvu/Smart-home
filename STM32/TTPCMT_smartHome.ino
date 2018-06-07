/*
  Multiple serial test

  Receives from Serial1, sends to Serial.

  The circuit:
    Maple connected over Serial
    Serial device (e.g. an Xbee radio, another Maple)

  created 30 Dec. 2008
  by Tom Igoe

  Ported to the Maple 27 May 2010
  by Bryan Newbold
*/

#include <SimpleKalmanFilter.h>
#define DEBUG             1

#define PIN_DEVICE        PB8
#define PIN_LED           PC13
#define TIME_OUT          1500
#define SENSOR_PIN        0
#define GET_SAMPLE_TIME   800
#define ACCEPT_VAL        0.01
#define TIMER_US          5

SimpleKalmanFilter simpleKalmanFilter(2, 2, 0.01);

// Serial output refresh time
const long SERIAL_REFRESH_TIME = 100;
long refresh_time;

int inByte;                     // Byte read from Serial1

float deviveThreshold;
float onVal, offVal;

bool calibSuccess = false;
float deviceThreshold = 0;
float sensor, sensorISR;

void turnOn() {
  digitalWrite(PIN_DEVICE, HIGH);
  digitalWrite(PIN_LED, LOW);
}

void turnOff() {
  digitalWrite(PIN_DEVICE, LOW);
  digitalWrite(PIN_LED, HIGH);
}

//float getSensor() {
//  return sensor;
//}

void calib() {
  float maxVal = 0, minVal = 1000.0;
  turnOff();
  delay(3000);
  unsigned long t = millis();
  t = millis();
  while (millis() - t < GET_SAMPLE_TIME) {
//#ifdef DEBUG
    Serial1.print("|");
    Serial1.print(sensor);
    Serial1.print("|");
//#endif
//    sensor = getSensor();
    if (maxVal < sensor)
      maxVal = sensor;
    if (minVal > sensor)
      minVal = sensor;
  }
  offVal = maxVal - minVal;
//#ifdef DEBUG
  Serial.print("|");
  Serial.print("min: ");
  Serial.print(minVal);
  Serial.print("max: ");
  Serial.print(maxVal);
  Serial.print("|");
//#endif
  turnOn();
  delay(3000);
  t = millis();
  maxVal = 0;
  minVal = 1000.0;
  while (millis() - t < GET_SAMPLE_TIME) {
//#ifdef DEBUG
    Serial1.print("|");
    Serial1.print(sensor);
    Serial1.print("|");
//#endif
//    sensor = getSensor();
    if (maxVal < sensor)
      maxVal = sensor;
    if (minVal > sensor)
      minVal = sensor;
  }
//#ifdef DEBUG
  Serial.print("|");
  Serial.print("min: ");
  Serial.print(minVal);
  Serial.print("max: ");
  Serial.print(maxVal);
  Serial.print("|");
//#endif

  onVal = maxVal - minVal;

  if (abs(onVal - offVal) > ACCEPT_VAL) {
    calibSuccess = true;
//#ifdef DEBUG
    Serial.print("|");
    Serial.print("calib ok");
    Serial.print("|");
//#endif
  }
  else {
    calibSuccess = false;
//#ifdef DEBUG
    Serial.print("|");
    Serial.print("calib not ok");
    Serial.print("|");
//#endif
  }
//#ifdef DEBUG
  Serial.print("|");
  Serial.print("calib");
  Serial.print(onVal - offVal);
  Serial.print("|");
//#endif
  turnOff();
  deviceThreshold = (onVal + offVal) / 2;
//#ifdef DEBUG
  Serial.print("|");
  Serial.print("Threshold: ");
  Serial.print(deviceThreshold);
  Serial.print("|");
//#endif
}

void setup() {
  // Initialize Serial1
  Serial.begin(115200);
  Serial1.begin(115200);
  pinMode(PC13, OUTPUT);
  digitalWrite(PC13, HIGH);
  pinMode(PB8, OUTPUT);
  Timer2.setMode(TIMER_CH1, TIMER_OUTPUTCOMPARE);
  Timer2.setPeriod(TIMER_US); // in microseconds
  Timer2.setCompare(TIMER_CH1, 1);      // overflow might be small
  Timer2.attachInterrupt(TIMER_CH1, timerIsr);
  calib();
}

void timerIsr() {
  float real_value = analogRead(SENSOR_PIN) / 1024.0 * 100.0;
  float estimated_value = simpleKalmanFilter.updateEstimate(real_value);
  sensor = estimated_value;
}

bool checkCurrent() {
  float minVal = 1000.0;
  float maxVal = 0;
  delay(3000);
  unsigned long t = millis();
  while (millis() - t < GET_SAMPLE_TIME) {
//#ifdef DEBUG
    Serial1.print("|");
    Serial1.print(sensor);
    Serial1.print("|");
//#endif
//    sensor = getSensor();
    if (sensor > maxVal)
      maxVal = sensor;
    if (sensor < minVal)
      minVal = sensor;
  }
//#ifdef DEBUG
  Serial.print("|");
  Serial.print("current check: ");
  Serial.print(maxVal - minVal);
  Serial.print("|");
//#endif
  if ((maxVal - minVal) > deviceThreshold)
    return true;
  else
    return false;
}

String s = "";

void loop() {
  // Read from Serial1, send over USB on Maple (or uses hardware serial 1 and hardware serial 2 on non-maple boards:
  if (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      if (s == "calib") {
        calib();
        if (calibSuccess){
          Serial.print("|");
          Serial.print("calibSuccess|");
        }
      }
      if (!calibSuccess){
        Serial.print("|");
        Serial.print("calibFail|");
      }
      else {
        if (s == "on") {
          turnOn();
          delay(10);
          bool check = checkCurrent();
          if (check == false)
            Serial.print("|error|");
          else
            Serial.print("|on|");
        }
        else if (s == "off") {
          turnOff();
          delay(10);
          bool check = checkCurrent();
          if (check == true)
            Serial.print("|error|");
          else
            Serial.print("|off|");
        } else {
          Serial.print("|UnknownCommand|");
        }
      }
      s = "";
    } else
      s = s + c;
  }
}
