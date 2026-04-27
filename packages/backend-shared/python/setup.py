#!/usr/bin/env python3

from setuptools import setup, find_packages
import os

# Read the contents of README file
this_directory = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(this_directory, '..', 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='superboard-backend-shared',
    version='0.1.0',
    description='Shared backend infrastructure components for SuperBoard microservices',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='SuperBoard Team',
    author_email='dev@superboard.com',
    url='https://github.com/superboard/backend-shared',
    packages=find_packages(),
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Topic :: System :: Distributed Computing',
    ],
    python_requires='>=3.9',
    install_requires=[
        'pika>=1.3.0',  # AMQP client
        'redis>=4.5.0',  # Redis client
        'psycopg2-binary>=2.9.0',  # PostgreSQL client
        'pydantic>=2.0.0',  # Data validation
        'prometheus-client>=0.17.0',  # Metrics
        'structlog>=23.0.0',  # Structured logging
        'tenacity>=8.2.0',  # Retry logic
        'asyncio-mqtt>=0.13.0',  # Async MQTT support
    ],
    extras_require={
        'dev': [
            'pytest>=7.0.0',
            'pytest-asyncio>=0.21.0',
            'pytest-cov>=4.0.0',
            'hypothesis>=6.75.0',  # Property-based testing
            'black>=23.0.0',  # Code formatting
            'flake8>=6.0.0',  # Linting
            'mypy>=1.4.0',  # Type checking
        ],
        'test': [
            'pytest>=7.0.0',
            'pytest-asyncio>=0.21.0',
            'pytest-cov>=4.0.0',
            'hypothesis>=6.75.0',
        ]
    },
    entry_points={
        'console_scripts': [
            'superboard-health-check=superboard_shared.cli:health_check',
        ],
    },
    include_package_data=True,
    zip_safe=False,
)