export function lastSeen({ date }: { date: Date }): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "invalid";
  }
  const now = new Date();
  const diff = Math.abs(now.getTime() - date.getTime());
  const diffInMinutes = Math.floor(diff / (1000 * 60));
  // Check if date is before year 2000 (unset)
  if (date.getTime() < new Date("2000-01-01").getTime()) {
    return "unknown";
  }
  if (diffInMinutes >= 60) {
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours} h ${minutes} min ago`;
  }
  return `${diffInMinutes} min ago`;
}

export function isMqttUpdated({
  date,
}: {
  date: Date | null | undefined;
}): boolean {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    //console.log("Invalid date or undefined");
    return false; // Return false if date is invalid or undefined
  }
  //console.log(`Valid date: ${date}`);
  const now = new Date();
  const diff = Math.abs(now.getTime() - date.getTime());
  const diffInMinutes = Math.floor(diff / (1000 * 60));
  return diffInMinutes < 180; // Check if the update was within the last 3 hours
}

interface DateStatus {
  online: (Date | string)[];
  offline: (Date | string)[];
}

export function sortMqttDates(
  dates: (Date | string | null | undefined)[]
): DateStatus {
  const online: (Date | string)[] = [];
  const offline: (Date | string)[] = [];

  dates.forEach((date) => {
    if (isMqttUpdated({ date: date ? new Date(date) : null })) {
      online.push(date!);
    } else {
      offline.push(date!);
    }
  });

  return { online, offline };
}
