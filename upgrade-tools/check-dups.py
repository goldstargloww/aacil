with open("hashes-sorted.txt", "r") as f:
    prev_line = f.readline()
    while True:
        this_line = f.readline()
        if not this_line:
            break

        prev_hash = prev_line[:64]
        this_hash = this_line[:64]

        if prev_hash == this_hash:
            print(this_line[66:], end='')

        prev_line = this_line
