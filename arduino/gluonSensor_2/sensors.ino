
#ifdef USE_ACCEL
  #include <Wire.h>
  #include <Adafruit_LIS3DH.h>
  #include <Adafruit_Sensor.h>
  Adafruit_LIS3DH lis = Adafruit_LIS3DH();
#endif

void setupSensors(){
  #if defined(USE_ACCEL)
    if (! lis.begin(0x18)) {   // change this to 0x19 for alternative i2c address
      Serial.println("Couldnt start");
      while (1);
    }
    Serial.println("LIS3DH found!");
    
    lis.setRange(LIS3DH_RANGE_4_G);   // 2, 4, 8 or 16 G!
    
    Serial.print("Range = "); Serial.print(2 << lis.getRange());  
    Serial.println("G");
  #endif

  #if defined(USE_DUST)
    pinMode(DUST_LED, OUTPUT);
  #endif
}


/*--------- ACCELEROMETER ----------*/

#define LIS3DH_CS 10
  
void updateAccel(){
  #if defined(USE_ACCEL)
      /* get a new sensor event, normalized */ 
    sensors_event_t event; 
    lis.getEvent(&event);
    
    /* Display the results (acceleration is measured in m/s^2) */
    Serial.print("\t\tX: "); Serial.print(event.acceleration.x);
    Serial.print(" \tY: "); Serial.print(event.acceleration.y); 
    Serial.print(" \tZ: "); Serial.print(event.acceleration.z); 
    Serial.println(" m/s^2 ");
  #endif
}

float getAccelVal(){
  return 1.0;
}



/*--------- DUST SENSOR ------------*/
#if defined(USE_DUST)
  int dustDelayTime = 280;
  int dustDelayTime2 = 40;
  float offTime = 9680;
  int dustVal = 0;
  
  void updateDust(){
    
    digitalWrite(DUST_LED, LOW); // power on the LED
    delayMicroseconds(dustDelayTime);
    dustVal = analogRead(DUST_PIN); // read the dust value via pin 5 on the sensor
    delayMicroseconds(dustDelayTime2);
    digitalWrite(DUST_LED, HIGH); // turn the LED off
    delayMicroseconds(offTime);
  }
  
  int getDustVal(){
    updateDust();
    Serial.print(F("dustVal: "));
    Serial.println(dustVal);
    return dustVal;
  }
#endif

/*---------- SOUND MICROPHONE ----------- */
#if defined (USE_MIC)
  double amplitudeArray[10];
  int currAmpIdx = -1;
  
  void updateSound(){
     unsigned long startMillis= millis();  // Start of sample window
     unsigned int peakToPeak = 0;   // peak-to-peak level
   
     unsigned int signalMax = 0;
     unsigned int signalMin = 1024;
   
     // collect data for 50 mS
     while (millis() - startMillis < sampleWindow)
     {
        sample = analogRead(0);
        if (sample < 1024)  // toss out spurious readings
        {
           if (sample > signalMax)
           {
              signalMax = sample;  // save just the max levels
           }
           else if (sample < signalMin)
           {
              signalMin = sample;  // save just the min levels
           }
        }
     }
     peakToPeak = signalMax - signalMin;  // max - min = peak-peak amplitude
     double volts = (peakToPeak * 3.3) / 1024;  // convert to volts
     amplitudeArray[++currAmpIdx] = volts;
     if(currAmpIdx > 8) currAmpIdx = -1;
    
    //Serial.println(volts);
  }
  
  float getAmplitudeAvg(){
    double currTotal = 0;
    for (int i=0; i<10; i++){
      currTotal += amplitudeArray[i];
    }
    return currTotal/10;
  }
#endif
