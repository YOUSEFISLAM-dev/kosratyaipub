# Korasty AI - WSGI Entry Point for PythonAnywhere
# This file is required by PythonAnywhere to serve your Flask app

import sys
import os

# Add your project directory to the sys.path
# Replace 'yourusername' with your PythonAnywhere username
project_home = '/home/yourusername/korasty-ai-backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Import your Flask app
from app import app as application
