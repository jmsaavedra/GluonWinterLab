
int lowDustVal = 75;
int highDustVal = 800;
int pixelUpdateWaitTime = 2000; // wait 2 secs before updating
long lastPixelUpdate = 0; // millis of last update


void updatePixels() {

  int numRed = map(dustVal, lowDustVal, highDustVal, 0, NUMPIXELS);
  int numGreen = NUMPIXELS - numRed;
  
  //  Serial.print("numRed: ");
  //  Serial.print(numRed);
  //  Serial.print("   numGrn: ");
  //  Serial.println(numGreen);

  if (millis() - lastPixelUpdate > pixelUpdateWaitTime) {
    lastPixelUpdate = millis();
    for (int i = 0; i < NUMPIXELS; i++) {
      if (i <= numRed)
        pixels.setPixelColor(i, pixels.Color(255, 0, 0)); // Moderately bright green color.
      else
        pixels.setPixelColor(i, pixels.Color(0, 255, 0)); // Moderately bright green color.
    }
    pixels.show(); // This sends the updated pixel color to the hardware.
  }
}

