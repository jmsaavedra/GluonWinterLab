#!/bin/bash

/usr/local/bin/gpio export 4 out	 # SHUTTER
/usr/local/bin/gpio export 17 out	# AUTO FOCUS
/usr/local/bin/gpio export 24 out	# RED LED
/usr/local/bin/gpio export 27 out	# GREEN LED
/usr/local/bin/gpio export 25 out	# BLUE LED
/usr/local/bin/gpio export 22 out	# 3MM LED
/usr/local/bin/gpio export 23 in 	# LASER
