
import { ProcessedFrame } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ResultsTableProps {
  results: ProcessedFrame[];
}

const ResultsTable = ({ results }: ResultsTableProps) => {
  const [selectedFrame, setSelectedFrame] = useState<ProcessedFrame | null>(null);

  if (results.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No results to display yet. Process frames to see results.</p>
      </Card>
    );
  }

  const crackResults = results.filter(result => result.hasCrack);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Detection Results</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {results.length}
          </Badge>
          <Badge variant="outline" className="bg-destructive/20 text-destructive text-sm">
            Cracks: {crackResults.length}
          </Badge>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Frame</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.frameId}>
                  <TableCell className="font-medium">{result.frameId}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <div 
                          className="h-16 w-28 bg-muted rounded cursor-pointer overflow-hidden"
                          onClick={() => setSelectedFrame(result)}
                        >
                          <img 
                            src={result.hasCrack ? result.processedImageUrl : result.imagePath} 
                            alt={`Frame ${result.frameId}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <div className="aspect-video w-full overflow-hidden rounded-md">
                          <img 
                            src={result.hasCrack ? result.processedImageUrl : result.imagePath} 
                            alt={`Frame ${result.frameId} Full`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-muted-foreground mb-1">Frame ID</p>
                            <p className="font-medium">{result.frameId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Status</p>
                            <p className="font-medium">
                              {result.hasCrack ? (
                                <span className="text-destructive">Crack Detected</span>
                              ) : (
                                <span className="text-green-500">No Crack</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Coordinates</p>
                            <p className="font-medium">
                              {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                            </p>
                          </div>
                          {result.hasCrack && (
                            <div>
                              <p className="text-muted-foreground mb-1">Confidence</p>
                              <p className="font-medium">
                                {(result.confidence! * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>{result.latitude.toFixed(6)}</TableCell>
                  <TableCell>{result.longitude.toFixed(6)}</TableCell>
                  <TableCell>
                    {result.hasCrack ? (
                      <Badge variant="destructive">Crack Detected</Badge>
                    ) : (
                      <Badge variant="secondary">No Crack</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.hasCrack
                      ? `${(result.confidence! * 100).toFixed(1)}%`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default ResultsTable;
