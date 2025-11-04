#!/bin/bash

# Production Deployment Validation Script
# This script validates the AssetTrack application deployment across different scenarios

set -e

echo "🚀 AssetTrack Production Deployment Validation"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-10}
    
    if command_exists curl; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")
        if [ "$response" = "$expected_status" ]; then
            print_status "success" "Endpoint $url returned $response"
            return 0
        else
            print_status "error" "Endpoint $url returned $response (expected $expected_status)"
            return 1
        fi
    else
        print_status "warning" "curl not available, skipping endpoint test"
        return 0
    fi
}

# Function to test database connection
test_database_connection() {
    local connection_string=$1
    
    if command_exists psql; then
        if psql "$connection_string" -c "SELECT version();" >/dev/null 2>&1; then
            print_status "success" "Database connection successful"
            return 0
        else
            print_status "error" "Database connection failed"
            return 1
        fi
    else
        print_status "warning" "psql not available, skipping database test"
        return 0
    fi
}

# Function to validate environment variables
validate_environment() {
    local env_file=$1
    
    if [ ! -f "$env_file" ]; then
        print_status "error" "Environment file $env_file not found"
        return 1
    fi
    
    print_status "info" "Validating environment variables in $env_file"
    
    # Required variables
    local required_vars=("SESSION_SECRET" "NODE_ENV")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_status "success" "All required environment variables present"
    else
        print_status "error" "Missing required variables: ${missing_vars[*]}"
        return 1
    fi
    
    # Check for database configuration
    if grep -q "DATABASE_URL=" "$env_file" || (grep -q "PGHOST=" "$env_file" && grep -q "PGUSER=" "$env_file"); then
        print_status "success" "Database configuration found"
    else
        print_status "error" "No database configuration found"
        return 1
    fi
    
    return 0
}

# Function to test Docker deployment
test_docker_deployment() {
    print_status "info" "Testing Docker deployment..."
    
    if ! command_exists docker; then
        print_status "warning" "Docker not available, skipping Docker tests"
        return 0
    fi
    
    # Test Docker Compose
    if command_exists docker-compose; then
        print_status "info" "Docker Compose is available"
        
        # Check if docker-compose.yml exists
        if [ -f "docker-compose.yml" ]; then
            print_status "success" "docker-compose.yml found"
            
            # Validate docker-compose syntax
            if docker-compose config >/dev/null 2>&1; then
                print_status "success" "Docker Compose syntax is valid"
            else
                print_status "error" "Docker Compose syntax validation failed"
                return 1
            fi
        else
            print_status "error" "docker-compose.yml not found"
            return 1
        fi
    else
        print_status "warning" "Docker Compose not available"
    fi
    
    return 0
}

# Function to test application build
test_application_build() {
    print_status "info" "Testing application build..."
    
    if ! command_exists npm; then
        print_status "warning" "npm not available, skipping build test"
        return 0
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_status "error" "package.json not found"
        return 1
    fi
    
    # Test npm install (dry run)
    if npm install --dry-run >/dev/null 2>&1; then
        print_status "success" "npm install would succeed"
    else
        print_status "error" "npm install would fail"
        return 1
    fi
    
    # Check build script
    if npm run build --dry-run >/dev/null 2>&1; then
        print_status "success" "Build script is available"
    else
        print_status "warning" "Build script not available or would fail"
    fi
    
    return 0
}

# Function to test SSL/TLS configuration
test_ssl_configuration() {
    print_status "info" "Testing SSL/TLS configuration..."
    
    if command_exists openssl; then
        # Check for SSL certificates in docker-compose files
        if grep -r "certificatesresolvers.letsencrypt" docker-compose*.yml >/dev/null 2>&1; then
            print_status "success" "Let's Encrypt SSL configuration found"
        else
            print_status "warning" "No Let's Encrypt SSL configuration found"
        fi
        
        # Check for SSL environment variables
        if grep -q "NODE_TLS_REJECT_UNAUTHORIZED" .env* 2>/dev/null; then
            print_status "success" "TLS configuration found in environment"
        else
            print_status "warning" "No TLS configuration found in environment"
        fi
    else
        print_status "warning" "openssl not available, skipping SSL tests"
    fi
    
    return 0
}

# Function to generate test report
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="deployment-validation-report-$(date '+%Y%m%d-%H%M%S').txt"
    
    {
        echo "AssetTrack Deployment Validation Report"
        echo "======================================"
        echo "Generated: $timestamp"
        echo ""
        echo "Environment Information:"
        echo "- Node.js: $(node --version 2>/dev/null || echo 'Not available')"
        echo "- npm: $(npm --version 2>/dev/null || echo 'Not available')"
        echo "- Docker: $(docker --version 2>/dev/null || echo 'Not available')"
        echo "- Docker Compose: $(docker-compose --version 2>/dev/null || echo 'Not available')"
        echo "- PostgreSQL: $(psql --version 2>/dev/null || echo 'Not available')"
        echo ""
        echo "Available Environment Files:"
        ls -la .env* 2>/dev/null || echo "No .env files found"
        echo ""
        echo "Docker Compose Files:"
        ls -la docker-compose*.yml 2>/dev/null || echo "No docker-compose files found"
        echo ""
        echo "Configuration Files:"
        ls -la *.config.* 2>/dev/null || echo "No config files found"
        echo ""
        echo "Validation Results:"
        echo "=================="
    } > "$report_file"
    
    print_status "info" "Validation report saved to $report_file"
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    print_status "info" "Running comprehensive deployment validation..."
    
    local tests_passed=0
    local tests_failed=0
    
    # Test environment files
    for env_file in .env .env.production .env.external-db .env.aws-rds .env.azure-db .env.digitalocean-db; do
        if [ -f "$env_file" ]; then
            if validate_environment "$env_file"; then
                ((tests_passed++))
            else
                ((tests_failed++))
            fi
        fi
    done
    
    # Test Docker deployment
    if test_docker_deployment; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Test application build
    if test_application_build; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Test SSL configuration
    if test_ssl_configuration; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Test database connections if available
    if [ -f ".env" ]; then
        local db_url=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)
        if [ -n "$db_url" ]; then
            if test_database_connection "$db_url"; then
                ((tests_passed++))
            else
                ((tests_failed++))
            fi
        fi
    fi
    
    # Generate report
    generate_report
    
    # Summary
    echo ""
    print_status "info" "Validation Complete!"
    echo "Tests Passed: $tests_passed"
    echo "Tests Failed: $tests_failed"
    echo "Total Tests: $((tests_passed + tests_failed))"
    
    if [ $tests_failed -eq 0 ]; then
        print_status "success" "All validation tests passed! 🎉"
        return 0
    else
        print_status "error" "Some validation tests failed. Please review the issues above."
        return 1
    fi
}

# Function to run specific deployment tests
run_deployment_test() {
    local deployment_type=$1
    
    case $deployment_type in
        "docker-internal")
            print_status "info" "Testing Docker with internal PostgreSQL..."
            validate_environment ".env"
            test_docker_deployment
            ;;
        "docker-external")
            print_status "info" "Testing Docker with external database..."
            validate_environment ".env.external-db"
            test_docker_deployment
            test_ssl_configuration
            ;;
        "docker-aws")
            print_status "info" "Testing Docker with AWS RDS..."
            validate_environment ".env.aws-rds"
            test_docker_deployment
            test_ssl_configuration
            ;;
        "docker-azure")
            print_status "info" "Testing Docker with Azure Database..."
            validate_environment ".env.azure-db"
            test_docker_deployment
            test_ssl_configuration
            ;;
        "docker-digitalocean")
            print_status "info" "Testing Docker with DigitalOcean Managed DB..."
            validate_environment ".env.digitalocean-db"
            test_docker_deployment
            test_ssl_configuration
            ;;
        "ubuntu")
            print_status "info" "Testing Ubuntu server deployment..."
            validate_environment ".env.production"
            test_application_build
            ;;
        "comprehensive")
            run_comprehensive_tests
            ;;
        *)
            print_status "error" "Unknown deployment type: $deployment_type"
            echo "Available types: docker-internal, docker-external, docker-aws, docker-azure, docker-digitalocean, ubuntu, comprehensive"
            return 1
            ;;
    esac
}

# Main execution
main() {
    local test_type="${1:-comprehensive}"
    
    echo "Starting deployment validation for: $test_type"
    echo ""
    
    if run_deployment_test "$test_type"; then
        print_status "success" "Deployment validation completed successfully!"
        exit 0
    else
        print_status "error" "Deployment validation failed!"
        exit 1
    fi
}

# Run main function with arguments
main "$@"