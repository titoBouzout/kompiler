echo "project"
call npm outdated

echo "client"
cd client
call npm outdated
cd ..

echo "socket"
cd socket
call npm outdated
cd ..


