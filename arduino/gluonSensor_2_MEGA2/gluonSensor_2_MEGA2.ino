

#define USE_DUST
#define USE_ACCEL
#define USE_DHT
#define USE_NEOPIXEL
//#define USE_MIC

#include <SPI.h>
#include <Adafruit_GPS.h>
#include <SoftwareSerial.h>
#include <SD.h>
#include <avr/sleep.h>

#if defined(USE_NEOPIXEL)
#include <Adafruit_NeoPixel.h>
#endif

#if defined(USE_DHT)
#include "DHT.h"
#endif


#define mySerial Serial1
Adafruit_GPS GPS(&mySerial);

//SoftwareSerial mySerial(8, 7);
//Adafruit_GPS GPS(&mySerial);

// Set GPSECHO to 'false' to turn off echoing the GPS data to the Serial console
// Set to 'true' if you want to debug and listen to the raw GPS sentences
#define GPSECHO  false
/* set to true to only log to SD when GPS has a fix, for debugging, keep it false */
#define LOG_FIXONLY true

// this keeps track of whether we're using the interrupt
// off by default!
boolean usingInterrupt = false;
void useInterrupt(boolean); // Func prototype keeps Arduino 0023 happy

// Set the pins used
#define chipSelect 10
#define ledPin 13
File logfile;

#if defined(USE_DHT)
#define DHTPIN 6     // what pin we're connected to
#define DHTTYPE DHT22   // DHT 22  (AM2302)
DHT dht(DHTPIN, DHTTYPE);
#endif

#if defined(USE_DUST)
#define DUST_LED 2
#define DUST_PIN A0
int dustVal = 0;
#endif


#if defined(USE_NEOPIXEL)
#define NEOPIXEL_PIN   5
#define NUMPIXELS      16
Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUMPIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
#endif

const int sampleWindow = 50; // Sample window width in mS (50 mS = 20Hz)
unsigned int sample;

void setup() {

  // connect at 115200 so we can read the GPS fast enough and echo without dropping chars
  // also spit it out
  Serial.begin(115200);
  Serial.println(F("\r\nGluonSensor"));
  pinMode(ledPin, OUTPUT);

  // make sure that the default chip select pin is set to
  // output, even if you don't use it:
  pinMode(10, OUTPUT);


  // see if the card is present and can be initialized:
  // if (!SD.begin(chipSelect)) { //for UNO
  if (!SD.begin(chipSelect, 11, 12, 13)) {
    Serial.println(F("Card init. failed!"));
    error(2);
  }
  char filename[15];
  strcpy(filename, "GPSLOG00.TXT");
  for (uint8_t i = 0; i < 100; i++) {
    filename[6] = '0' + i / 10;
    filename[7] = '0' + i % 10;
    if (! SD.exists(filename)) { // create if does not exist, do not open existing, write, sync after write
      break;
    }
  }

  logfile = SD.open(filename, FILE_WRITE);
  if ( ! logfile ) {
    Serial.print(F("Couldnt create ")); Serial.println(filename);
    error(3);
  }
  Serial.print(F("Writing to ")); Serial.println(filename);

  // connect to the GPS at the desired rate
  GPS.begin(9600);

  // uncomment this line to turn on RMC (recommended minimum) and GGA (fix data) including altitude
  //GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);
  // uncomment this line to turn on only the "minimum recommended" data
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCONLY);
  // For logging data, we don't suggest using anything but either RMC only or RMC+GGA
  // to keep the log files at a reasonable size
  // Set the update rate
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);   // 1 or 5 Hz update rate

  // Turn off updates on antenna status, if the firmware permits it
  GPS.sendCommand(PGCMD_NOANTENNA);

  useInterrupt(true);
  Serial.println(F("Ready!"));

#if defined(USE_DHT)
  dht.begin();
#endif

#if defined(USE_NEOPIXEL)
  pixels.begin(); // This initializes the NeoPixel library.
#endif

  setupSensors();
}

void loop() {
#if defined(USE_DHT)
  float h = dht.readHumidity();
  float t = dht.readTemperature();
#endif

#if defined(USE_MIC)
  updateSound();
#endif

#if defined(USE_DUST)
  updateDust();
#endif

#if defined(USE_ACCEL)
  updateAccel();
#endif

  // if a sentence is received, we can check the checksum, parse it...
  if (GPS.newNMEAreceived()) {
    // a tricky thing here is if we print the NMEA sentence, or data
    // we end up not listening and catching other sentences!
    // so be very wary if using OUTPUT_ALLDATA and trying to print out data
    //Serial.println(GPS.lastNMEA());   // this also sets the newNMEAreceived() flag to false
    
    char *stringptr = GPS.lastNMEA();
    
    if (!GPS.parse(GPS.lastNMEA()))   // this also sets the newNMEAreceived() flag to false
      return;  // we can fail to parse a sentence in which case we should just wait for another
    
    
    // Sentence parsed!
    Serial.println(F("OK"));
    if (LOG_FIXONLY && !GPS.fix) {
      Serial.print(F("No Fix"));
      return;
    }

    // Rad. lets log it!
    Serial.println(F("Log"));

    
//    uint8_t stringsize = strlen(stringptr) - 1; //subtract 2 to eliminate <cr>
//    if (stringsize != logfile.write((uint8_t *)stringptr, stringsize))    //write the string to the SD file
//      error(4);
    logfile.print("$data,"); 
    logfile.print(GPS.latitudeDegrees, 6); logfile.print(",");
    logfile.print(GPS.longitudeDegrees, 6);

#if defined(USE_DHT)
    logfile.print(","); logfile.print(h, 2);
    logfile.print(","); logfile.print(t, 2); //append temp and humidity
#endif

#if defined(USE_MIC)
    logfile.print(","); logfile.print(getAmplitudeAvg(), 2); //append microphone sound
#endif

#if defined(USE_ACCEL)
    logfile.print(","); logfile.print(getAccelVal(), 2); //append dust value
#endif

#if defined(USE_DUST)
    logfile.print(","); logfile.println(getDustVal(), DEC); //append dust value
#endif

    if (strstr(stringptr, "RMC"))
      logfile.flush();
      
  }

#if defined(USE_NEOPIXEL)
  updatePixels();
#endif

}





