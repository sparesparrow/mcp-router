#!/usr/bin/env python3
import pytest
import sys
import os
import logging
from datetime import datetime

def setup_logging():
    """Set up logging for test execution."""
    log_dir = "test_logs"
    os.makedirs(log_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"test_run_{timestamp}.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_file

def run_tests():
    """Run the test suite using pytest configuration from pyproject.toml."""
    log_file = setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("Starting test execution")
    
    try:
        # Run tests using pytest's configuration from pyproject.toml
        result = pytest.main()
        
        if result == 0:
            logger.info("All tests passed successfully")
        else:
            logger.error("Some tests failed. Check the log file: %s", log_file)
            
        return result
        
    except Exception as e:
        logger.error("Error running tests: %s", str(e), exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(run_tests()) 