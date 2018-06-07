#include <WiFi.h>
#include <PubSubClient.h>
#include <HardwareSerial.h>

#define TOUCH 22
#define touchRange 30
#define TIME_OUT_CALIB 3000

HardwareSerial MySerial(1);

/* change it with your ssid-password */
const char* ssid = "netfpga";
const char* password = "ktmt201_c5";
/* this is the IP of PC/raspberry where you installed MQTT Server */
const char* mqtt_server  = "115.79.27.129";
const int   port         = 9015;
//const char* mqttUser     = "ulwrtaoc";
//const char* mqttPassword = "SUzhOrzguPJ9";
/*LED GPIO pin*/
const char  led          = 12;
long        lastMsg = 0;
char        msg[20];
String      msg_from_stm32 = "";
bool state = false, light = false;
int preTouch = 0;
int counter = 0;
unsigned long t = 0;
int getTouch = 0;
int deviceStatus = 0;
/* create an instance of PubSubClient client */
WiFiClient espClient;
PubSubClient client(espClient);

//set calib to detect current
//bool sendCalib() {
//  unsigned long touch_begin = millis();
//  //  if (digitalRead <= touchRange) {
//  //    touch_begin = millis();
//  //  }
//  if (digitalRead(TOUCH)
//  unsigned long time_touch = millis() - touch_begin;
////  if (time_touch > 1000) {
////    Serial.print("Time: ");
////    Serial.println(time_touch);
////}
//  if (time_touch > 3000) return 1;
//  else return 0;
//}

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
    if (client.connect(clientId.c_str()/*, mqttUser, mqttPassword*/)) {
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

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  /* set led as output to control led on-off */
  pinMode(led, OUTPUT);
  pinMode(TOUCH, INPUT);

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  /* configure the MQTT server with IPaddress and port */
  client.setServer(mqtt_server, port);
  /* this receivedCallback function will be invoked
    when client received subscribed topic */
  client.setCallback(receivedCallback);
  /*start DHT sensor */
  MySerial.print("off\n");
  deviceStatus = 0;
  //store time' begining

}
void loop() {
 // MySerial.print("on\n");
  /* if client was disconnected then try to reconnect again */
  if (!client.connected()) {
    mqttconnect();
  }
  /* this function will listen for incomming
    subscribed topic-process-invoke receivedCallback */
  client.loop();
  
  getTouch = digitalRead(22);
  if(getTouch==1 && preTouch==0){
    MySerial.print("on\n");
    Serial.print("Led: ");
    Serial.print("on\n");
  }
  if(getTouch==0 && preTouch==1){
    MySerial.print("off\n");
    Serial.print("Led: ");
    Serial.print("off\n");
  }
  preTouch = getTouch;

  while (MySerial.available()) {
    char data = MySerial.read();
//    unsigned long uart_begin = millis();
//    while (MySerial.available()) {
      if (data == '|') {
//        Serial.print("Message from STM32: ");
        Serial.println(msg_from_stm32);
        if ((msg_from_stm32 == "on" || msg_from_stm32 == "off" || msg_from_stm32 == "error")/* && (uart_begin < 10000)*/) {
          Serial.println("Feed back OK!");
          Serial.println("MQTT published!");
          client.publish("espToServer", msg_from_stm32 == "on" ? "ON" : "OFF");
        }
        msg_from_stm32 = "";
      } else 
        msg_from_stm32 += data;
//    } 
  }
}
