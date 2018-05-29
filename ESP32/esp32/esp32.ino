#include <WiFi.h>
#include <PubSubClient.h>
#include <HardwareSerial.h>

#define TOUCH 4
#define touchRange 20

HardwareSerial MySerial(1);

/* change it with your ssid-password */
const char* ssid = "gr5 2017";
const char* password = "12345678";
/* this is the IP of PC/raspberry where you installed MQTT Server */
const char* mqtt_server  = "192.168.43.48";
const int   port         = 2000;
//const char* mqttUser     = "vhnyvxsu";
//const char* mqttPassword = "vVA4tmFkLz-k";
/*LED GPIO pin*/
const char  led          = 12;
long        lastMsg = 0;
char        msg[20];
String      msg_from_stm32 = "";
bool state = false, light = false;
/* create an instance of PubSubClient client */
WiFiClient espClient;
PubSubClient client(espClient);

//set calib to detect current
bool sendCalib(uint16_t (*touchRead)(uint8_t)) {
  unsigned long touch_begin = millis();
  //  if (touchRead <= touchRange) {
  //    touch_begin = millis();
  //  }
  while (touchRead(TOUCH) < touchRange) {
    continue;
  }
  unsigned long time_touch = millis() - touch_begin;
  if (time_touch > 1000) {
    Serial.print("Time: ");
    Serial.println(time_touch);
  }
  if (time_touch > 3000) return 1;
  else return 0;
}

void receivedCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received: ");
  Serial.println(topic);
  String message = "";

  Serial.print("payload: ");
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  MySerial.print(message == "ON" ? "on\n" : "off\n");
}

void mqttconnect() {
  /* Loop until reconnected */
  while (!client.connected()) {
    Serial.print("MQTT connecting ...");
    /* client ID */
    String clientId = "ESP32Client";
    /* connect now */
    //, mqttUser, mqttPassword
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      /* subscribe topic with default QoS 0*/
      client.subscribe("ESP32");
    } else {
      Serial.print("failed, status code =");
      Serial.print(client.state());
      Serial.println("try again in 5 seconds");
      /* Wait 5 seconds before retrying */
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  MySerial.begin(115200, SERIAL_8N1, 16, 17);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

//  WiFi.begin(ssid, password);

//  while (WiFi.status() != WL_CONNECTED) {
//    delay(500);
//    Serial.print(".");
//  }
  /* set led as output to control led on-off */
  pinMode(led, OUTPUT);

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  /* configure the MQTT server with IPaddress and port */
//  client.setServer(mqtt_server, port);
  /* this receivedCallback function will be invoked
    when client received subscribed topic */
//  client.setCallback(receivedCallback);
  /*start DHT sensor */

  //store time' begining

}
void loop() {
  /* if client was disconnected then try to reconnect again */
//  if (!client.connected()) {
//    mqttconnect();
//  }
  /* this function will listen for incomming
    subscribed topic-process-invoke receivedCallback */
//  client.loop();

  if (touchRead(TOUCH) < touchRange && state == false) {
    //set calip
    if (sendCalib(touchRead)) {
      Serial.println("calib");
      MySerial.print("calib");
    }
    // Toggle
    else {
      state = true;
      light = !light;
      MySerial.print(light ? "on\n" : "off\n");
      Serial.print("Led: ");
      Serial.print(light ? "on\n" : "off\n");
    }
  } else if (touchRead(TOUCH) >= touchRange) {
    state = false;
  }

  if (MySerial.available()) {
    char data = 0;
    while (MySerial.available()) {
      data = MySerial.read();
      msg_from_stm32 += data;
    }
    if (data == '\n') {
      Serial.print("Message from STM32: ");
      Serial.println(msg_from_stm32);

      if (msg_from_stm32 == "on\n" || msg_from_stm32 == "off\n") {
        Serial.println("Feed back OK!");
        Serial.println("MQTT published!");
        client.publish("espToServer", msg_from_stm32 == "on\n" ? "ON" : "OFF");
      }
    }
    else if (msg_from_stm32 == "error\n") {
      Serial.println("control error!");
       client.publish("espToServer", "error");
    }

    msg_from_stm32 = "";
  }

  delay(100);
}
