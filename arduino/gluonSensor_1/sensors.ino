//our senors!

#define DEBUG_SENSORS 0 //0 = no debug print, 1 = print debug

#define SENSOR_INTERVAL 2000 //milliseconds

long lastSensorReadTime = 1;

/*** DHT SENSOR ***/
#include "DHT.h"
#define DHTPIN 4        // DHT22 DATA PIN
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
DHT dht(DHTPIN, DHTTYPE);


void setupSensors(){

  dht.begin();
}

void updateSensors(){
 
  
  if(millis() - lastSensorReadTime > SENSOR_INTERVAL){
    Serial.println("ABOUT TO UPDATE DHT");
//    updateDHT();
    lastSensorReadTime = millis();
  }
}


void updateDHT(){
  
  // Read the humidity (% RH)
  humidity = dht.readHumidity();
  
  // Read temperature as Celsius (the default)
  tCelsius = dht.readTemperature();

  // Compute the "heat index" (perceived temperature)
  hiCelsius = dht.computeHeatIndex(tCelsius, humidity, false);

  if(DEBUG_SENSORS){
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.print(" %\t");
    Serial.print("Temperature: ");
    Serial.print(tCelsius);
    Serial.print(" *C ");
    Serial.print(" %\t");
    Serial.print("Heat Index: ");
    Serial.print(hiCelsius);
    Serial.println(" *C ");
  }
}


