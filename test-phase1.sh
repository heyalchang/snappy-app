#!/bin/bash

echo "🧪 Phase 1 Exit Criteria Validation"
echo "=================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_pass() {
    echo -e "${GREEN}✓ $1${NC}"
}

test_fail() {
    echo -e "${RED}✗ $1${NC}"
}

test_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo ""
echo "1. Checking TypeScript compilation..."
if npx tsc --noEmit; then
    test_pass "TypeScript compilation successful"
else
    test_fail "TypeScript compilation failed"
fi

echo ""
echo "2. Checking Expo configuration..."
if npx expo-doctor > /tmp/expo-doctor.log 2>&1; then
    if grep -q "No issues detected" /tmp/expo-doctor.log; then
        test_pass "Expo configuration valid"
    else
        test_warn "Expo doctor found some issues (check manually)"
    fi
else
    test_fail "Expo doctor failed"
fi

echo ""
echo "3. Checking project structure..."
required_dirs=(
    "src/screens"
    "src/components"
    "src/services"
    "src/utils"
    "src/types"
    "docs"
)

all_dirs_exist=true
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        test_pass "Directory exists: $dir"
    else
        test_fail "Missing directory: $dir"
        all_dirs_exist=false
    fi
done

echo ""
echo "4. Checking required files..."
required_files=(
    "src/App.tsx"
    "src/Navigation.tsx"
    "src/types/index.ts"
    "src/services/firebase.ts"
    "src/services/auth.ts"
    "src/screens/AuthScreen.tsx"
    "src/screens/PhoneNumberScreen.tsx"
    "src/screens/VerifyCodeScreen.tsx"
    "src/screens/UsernameScreen.tsx"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        test_pass "File exists: $file"
    else
        test_fail "Missing file: $file"
        all_files_exist=false
    fi
done

echo ""
echo "5. Checking dependencies..."
if [ -f "package.json" ]; then
    deps=$(cat package.json)
    
    if echo "$deps" | grep -q "typescript"; then
        test_pass "TypeScript installed"
    else
        test_fail "TypeScript not found"
    fi
    
    if echo "$deps" | grep -q "@react-navigation/native"; then
        test_pass "React Navigation installed"
    else
        test_fail "React Navigation not found"
    fi
    
    if echo "$deps" | grep -q "firebase"; then
        test_pass "Firebase installed"
    else
        test_fail "Firebase not found"
    fi
else
    test_fail "package.json not found"
fi

echo ""
echo "6. Checking documentation..."
if [ -f "docs/WK1-Foundation-Auth-Results.md" ]; then
    test_pass "Week 1 results documented"
else
    test_fail "Week 1 results not documented"
fi

if [ -f "docs/Phase1-Testing-Exit-Criteria.md" ]; then
    test_pass "Testing criteria documented"
else
    test_fail "Testing criteria not documented"
fi

echo ""
echo "=================================="
echo "📋 Summary"
echo "=================================="
echo ""
echo "Next steps for manual testing:"
echo "1. Run 'npm start' and test in Expo Go"
echo "2. Complete the manual testing checklist in docs/Phase1-Testing-Exit-Criteria.md"
echo "3. Verify all UI flows work as expected"
echo ""
echo "Once all tests pass, Phase 1 is complete! 🎉"