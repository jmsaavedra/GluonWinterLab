
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

